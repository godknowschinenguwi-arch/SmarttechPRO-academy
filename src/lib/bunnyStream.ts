// Bunny Stream integration — https://docs.bunny.net/reference/video-api-overview
// Server-side only: never expose BUNNY_STREAM_API_KEY to the client.
//
// Setup:
//  1. Create a Stream library at bunny.net/stream — note its Library ID.
//  2. In that library's API settings, copy the Video Library API Key.
//  3. Note the pull zone hostname it generates (Library > General), e.g. vz-xxxxxxx.b-cdn.net.
//  4. Optionally enable Token Authentication on the pull zone (Security tab) and copy its
//     Authentication Key, for signed/expiring playback URLs.
//  5. Set BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_STREAM_PULL_ZONE (+ optional
//     BUNNY_STREAM_TOKEN_AUTH_KEY) in your environment.
//
// See scripts/upload-lesson-video.mjs for a ready-to-run CLI that uploads a local
// file and attaches its playback URL to a Lesson using this module.
//
// Not yet exercised against a live Bunny account — written to the documented API
// contract. Verify token-auth signing against Bunny's dashboard example once
// Token Authentication is enabled, since exact conventions can vary by zone setting.

import { createHash } from 'crypto';

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const API_KEY = process.env.BUNNY_STREAM_API_KEY;
const PULL_ZONE = process.env.BUNNY_STREAM_PULL_ZONE; // e.g. vz-xxxxxxx.b-cdn.net
const TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY; // optional, enables signed URLs

export const bunnyStreamConfigured = !!(LIBRARY_ID && API_KEY && PULL_ZONE);

function apiBase(): string {
  return `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`;
}

function requireConfigured() {
  if (!bunnyStreamConfigured) {
    throw new Error('Bunny Stream is not configured — set BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY and BUNNY_STREAM_PULL_ZONE.');
  }
}

/** Creates a video entry in the library and returns its GUID, ready to receive the upload. */
export async function createVideo(title: string): Promise<string> {
  requireConfigured();
  const res = await fetch(apiBase(), {
    method: 'POST',
    headers: { AccessKey: API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Bunny Stream createVideo failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.guid as string;
}

/** Uploads raw video bytes to an existing video entry (see createVideo). */
export async function uploadVideo(guid: string, body: Buffer): Promise<void> {
  requireConfigured();
  const res = await fetch(`${apiBase()}/${guid}`, {
    method: 'PUT',
    headers: { AccessKey: API_KEY!, 'Content-Type': 'application/octet-stream' },
    body: body as unknown as BodyInit,
  });
  if (!res.ok) throw new Error(`Bunny Stream upload failed: ${res.status} ${await res.text()}`);
}

export type BunnyVideoStatus = { status: number; encodeProgress: number; length: number };

/** Polls encode/transcode status. status: 0 Created, 1 Uploaded, 2 Processing, 3 Transcoding, 4 Finished, 5 Error. */
export async function getVideoStatus(guid: string): Promise<BunnyVideoStatus> {
  requireConfigured();
  const res = await fetch(`${apiBase()}/${guid}`, { headers: { AccessKey: API_KEY! } });
  if (!res.ok) throw new Error(`Bunny Stream getVideoStatus failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { status: data.status, encodeProgress: data.encodeProgress ?? 0, length: data.length ?? 0 };
}

export async function deleteVideo(guid: string): Promise<void> {
  requireConfigured();
  await fetch(`${apiBase()}/${guid}`, { method: 'DELETE', headers: { AccessKey: API_KEY! } });
}

/**
 * Direct HLS playlist URL for a video, suitable for VideoPlayer's `src`. If
 * BUNNY_STREAM_TOKEN_AUTH_KEY is set, appends a signed token that expires after
 * `ttlSeconds` (default 4h) — requires Token Authentication enabled on the pull zone.
 */
export function playbackUrl(guid: string, ttlSeconds = 4 * 3600): string {
  if (!PULL_ZONE) throw new Error('BUNNY_STREAM_PULL_ZONE is not set.');
  const path = `/${guid}/playlist.m3u8`;
  if (!TOKEN_KEY) return `https://${PULL_ZONE}${path}`;

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = createHash('sha256')
    .update(`${TOKEN_KEY}${path}${expires}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `https://${PULL_ZONE}${path}?token=${token}&expires=${expires}`;
}
