import Link from 'next/link';
import { getCertificate } from '@/lib/queries';

export default async function VerifyPage({ params }: { params: { serial: string } }) {
  const cert = await getCertificate(decodeURIComponent(params.serial));

  if (!cert) {
    return (
      <div className="container-x flex justify-center py-20">
        <div className="card w-full max-w-lg border-l-4 border-l-rose-500 p-8 text-center">
          <span className="text-4xl">❌</span>
          <h1 className="h-display mt-4 text-2xl">Certificate not found</h1>
          <p className="mt-2 text-sm text-ink-faint">
            No certificate matches serial <span className="font-mono font-bold">{decodeURIComponent(params.serial)}</span>.
            Check the number or contact support@smarttech.academy.
          </p>
          <Link href="/verify" className="btn-ghost mt-6">Try another serial</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x flex justify-center py-20">
      <div className="w-full max-w-2xl">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 bg-emerald-500 px-6 py-4 text-white">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-display font-bold">Valid certificate</p>
              <p className="text-xs text-white/80">Issued and verified by SmartTech Academy</p>
            </div>
          </div>
          {/* Certificate rendering */}
          <div className="relative m-6 rounded-2xl border-4 border-double border-brand-200 bg-gradient-to-br from-white to-brand-50 p-10 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-brand-600">SmartTech Academy</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-faint">Certificate of Completion</p>
            <p className="mt-6 text-sm text-ink-faint">This certifies that</p>
            <p className="h-display mt-1 text-3xl">{cert.studentName}</p>
            <p className="mt-4 text-sm text-ink-faint">has successfully completed</p>
            <p className="mt-1 font-display text-xl font-bold text-brand-800">{cert.courseTitle}</p>
            <p className="mt-4 text-xs text-ink-faint">{cert.hoursCompleted} hours · Instructor: {cert.instructorName}</p>
            <div className="mt-8 flex items-end justify-between text-left">
              <div>
                <p className="font-mono text-xs font-bold">{cert.serial}</p>
                <p className="text-[10px] text-ink-faint">Issued {new Date(cert.issuedAt).toDateString()}</p>
              </div>
              {/* QR placeholder (production: QR of this URL) */}
              <div className="grid h-16 w-16 grid-cols-4 gap-0.5 rounded bg-white p-1 shadow-card">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className={`${[0,1,3,4,5,7,8,10,12,14,15].includes(i) ? 'bg-ink' : 'bg-white'} rounded-[2px]`} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 px-6 pb-6">
            <a href={`/api/certificates/${cert.serial}/pdf`} target="_blank" className="btn-primary !px-5 !py-2.5 text-xs">
              ⬇ Download Official PDF
            </a>
            <span className="text-xs text-ink-faint">
              {cert.kind === 'PRACTICAL' ? 'Practical competence (hands-on assessed)' : 'Course completion'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
