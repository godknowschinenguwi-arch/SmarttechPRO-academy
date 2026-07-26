import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';

// Free, no-API-key data sources:
// - Nominatim (OpenStreetMap) for address -> coordinates. Fine for this app's
//   traffic; a production app at scale should move to a paid geocoder per
//   Nominatim's usage policy.
// - NASA POWER climatology API for long-term average daily solar irradiance
//   (kWh/m²/day), which is numerically the same figure as "peak sun hours".
const FETCH_TIMEOUT_MS = 8000;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function geocode(address: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'SmartTechSolarCalculator/1.0 (support@smarttech.academy)' },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  const first = Array.isArray(data) ? data[0] : null;
  if (!first || !Number.isFinite(Number(first.lat)) || !Number.isFinite(Number(first.lon))) return null;
  const label = typeof first.display_name === 'string' ? first.display_name.split(',').slice(0, 3).join(',').trim() : address;
  return { lat: Number(first.lat), lon: Number(first.lon), label };
}

async function fetchIrradiance(lat: number, lon: number): Promise<number | null> {
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;
  const res = await fetchWithTimeout(url).catch(() => null);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  const param = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
  if (!param || typeof param !== 'object') return null;
  if (typeof param.ANN === 'number') return param.ANN;
  const values = MONTHS.map((m) => param[m]).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`solar-irradiance:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  let lat: number | null = Number.isFinite(body.lat) ? Number(body.lat) : null;
  let lon: number | null = Number.isFinite(body.lon) ? Number(body.lon) : null;
  let label: string | null = null;

  if ((lat === null || lon === null) && typeof body.address === 'string' && body.address.trim()) {
    const geo = await geocode(body.address.trim().slice(0, 200));
    if (!geo) {
      return NextResponse.json(
        { error: "Could not find that address. Try a nearby town/city, or enter peak sun hours manually." },
        { status: 404 }
      );
    }
    lat = geo.lat;
    lon = geo.lon;
    label = geo.label;
  }

  if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
  }

  const psh = await fetchIrradiance(lat, lon);
  if (psh === null) {
    return NextResponse.json(
      { error: 'Could not fetch solar data for this location. Please enter peak sun hours manually.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ psh: Math.round(psh * 100) / 100, lat, lon, label });
}
