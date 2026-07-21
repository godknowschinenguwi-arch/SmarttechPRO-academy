// SmartTech Academy — seed script (applies DDL, then seeds demo data if empty).
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { LESSON_CONTENT, QUIZ_QUESTIONS, ASSIGNMENT_BRIEFS } from './content.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// Seeds DATABASE_URL if set (e.g. a remote Turso database on first deploy), else the local dev file.
// Idempotent: skips entirely when users already exist.
const db = createClient({
  url: process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')
    ? process.env.DATABASE_URL
    : `file:${path.join(here, 'dev.db')}`,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});
const J = JSON.stringify;

async function ins(table, data) {
  const id = data.id ?? randomUUID();
  const row = { id, ...data };
  const keys = Object.keys(row);
  const vals = keys.map((k) => {
    const v = row[k];
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v instanceof Date) return v.toISOString();
    return v;
  });
  await db.execute({
    sql: `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    args: vals,
  });
  return id;
}

// Course cover images — backfilled on every run so existing (already-seeded)
// databases pick up new/updated covers. Swap these paths for real job photos anytime.
const COVERS = {
  'cctv-installation-technician': '/covers/cctv-installation-technician.svg',
  'solar-installation-professional': '/covers/solar-installation-professional.svg',
  'networking-for-technicians': '/covers/networking-for-technicians.svg',
  'electric-fence-installation': '/covers/electric-fence-installation.svg',
  'plc-programming-fundamentals': '/covers/plc-programming-fundamentals.svg',
  'ai-cctv-computer-vision': '/covers/ai-cctv-computer-vision.svg',
  'technician-business-startup': '/covers/technician-business-startup.svg',
};

async function backfillCovers() {
  for (const [slug, url] of Object.entries(COVERS)) {
    await db.execute({ sql: 'UPDATE Course SET imageUrl = ? WHERE slug = ?', args: [url, slug] });
  }
  console.log('Course covers backfilled.');
}

// Replaces placeholder lesson content, quiz questions and assignment briefs
// with the real material from the companion book (see prisma/content.mjs).
// Runs unconditionally — like backfillCovers() above — so it safely updates
// an already-seeded database (including the live one) without touching
// Users, Enrollments, Payments or any other student data. Matches purely by
// title, so it's safe to re-run any number of times.
async function backfillLessonContent() {
  let lessonsUpdated = 0;
  for (const [title, html] of Object.entries(LESSON_CONTENT)) {
    const res = await db.execute({ sql: 'UPDATE Lesson SET contentHtml = ? WHERE title = ?', args: [html.trim(), title] });
    lessonsUpdated += res.rowsAffected ?? 0;
  }

  let quizzesUpdated = 0;
  for (const [quizTitle, qs] of Object.entries(QUIZ_QUESTIONS)) {
    const quiz = await db.execute({ sql: 'SELECT id FROM Quiz WHERE title = ?', args: [quizTitle] });
    const quizId = quiz.rows[0]?.id;
    if (!quizId) continue;
    await db.execute({ sql: 'DELETE FROM Question WHERE quizId = ?', args: [quizId] });
    for (let q = 0; q < qs.length; q++) {
      await ins('Question', { quizId, order: q + 1, kind: qs[q][0], prompt: qs[q][1], options: J(qs[q][2]), answer: J(qs[q][3]) });
    }
    quizzesUpdated += 1;
  }

  let assignmentsUpdated = 0;
  for (const [assignTitle, brief] of Object.entries(ASSIGNMENT_BRIEFS)) {
    const res = await db.execute({ sql: 'UPDATE Assignment SET brief = ? WHERE title = ?', args: [brief, assignTitle] });
    assignmentsUpdated += res.rowsAffected ?? 0;
  }

  console.log(`Lesson content backfilled — ${lessonsUpdated} lessons, ${quizzesUpdated} quizzes (questions replaced), ${assignmentsUpdated} assignments.`);
}

async function main() {
  const ddl = readFileSync(path.join(here, 'schema.sql'), 'utf8');
  for (const s of ddl.split(';').map((x) => x.trim()).filter(Boolean)) await db.execute(s);

  await backfillCovers();

  const existing = await db.execute('SELECT COUNT(*) AS n FROM User');
  if (Number(existing.rows[0].n) > 0) {
    console.log('Seed skipped — database already populated.');
    // Content backfills still run on an already-seeded (including the live)
    // database — that's the whole point of keeping them separate from the
    // one-time demo-data seed below, which must never re-run once users exist.
    await backfillLessonContent();
    return;
  }

  const hash = await bcrypt.hash('Password123!', 10);

  // ---- Users ----
  await ins('User', { email: 'admin@smarttech.academy', passwordHash: hash, name: 'Admin', role: 'ADMIN', country: 'Zimbabwe', city: 'Harare' });
  const tapiwa = await ins('User', {
    email: 'tapiwa@smarttech.academy', passwordHash: hash, name: 'Eng. Tapiwa Moyo', role: 'INSTRUCTOR',
    headline: 'Security Systems Engineer · 12 yrs field experience', city: 'Harare', country: 'Zimbabwe',
    bio: 'Tapiwa has installed and commissioned over 900 CCTV systems across Southern Africa, from retail sites to industrial plants. He leads SmartTech Academy’s security systems faculty.',
  });
  const rudo = await ins('User', {
    email: 'rudo@smarttech.academy', passwordHash: hash, name: 'Rudo Ncube', role: 'INSTRUCTOR',
    headline: 'Solar PV Designer · 2,000+ installers trained', city: 'Bulawayo', country: 'Zimbabwe',
    bio: 'Rudo designs off-grid and hybrid solar systems and leads the renewable energy faculty.',
  });
  const student = await ins('User', {
    email: 'student@smarttech.academy', passwordHash: hash, name: 'Godknows Chinenguwi', role: 'STUDENT',
    city: 'Harare', country: 'Zimbabwe', xp: 1240, level: 3, streakDays: 6, headline: 'Trainee Technician',
  });

  // ---- Categories ----
  const cats = {};
  for (const [name, slug, icon] of [
    ['Security Systems', 'security-systems', '🎥'],
    ['Networking', 'networking', '🌐'],
    ['Solar', 'solar', '☀️'],
    ['Electrical', 'electrical', '⚡'],
    ['Automation', 'automation', '🤖'],
    ['Artificial Intelligence', 'artificial-intelligence', '🧠'],
    ['Industrial Automation', 'industrial-automation', '🏭'],
    ['Business Skills', 'business-skills', '💼'],
  ]) cats[slug] = await ins('Category', { name, slug, icon });

  // ---- Flagship CCTV course ----
  const cctv = await ins('Course', {
    slug: 'cctv-installation-technician',
    title: 'Certified CCTV Installation Technician',
    subtitle: 'From first camera to full commercial installations — analogue, IP, AI and solar-powered CCTV.',
    description: 'A complete, job-ready programme covering everything a professional CCTV installer needs: camera technology, DVR/NVR configuration, structured cabling, IP networking, remote viewing, AI analytics, solar-powered systems, troubleshooting and how to run your installation business. Finish with an optional hands-on practical assessment in your city and earn a verifiable certificate.',
    objectives: J([
      'Select the right cameras, recorders and storage for any site',
      'Run, terminate and test coax and Cat6 cabling to professional standards',
      'Configure DVR/NVR systems and remote viewing on phones and PCs',
      'Design solar-powered CCTV for off-grid sites',
      'Deploy AI analytics: line crossing, intrusion, face and plate detection',
      'Diagnose and repair common faults quickly',
      'Quote, invoice and win installation contracts',
    ]),
    requirements: J(['No prior experience required', 'A smartphone or computer with internet', 'Hand tools recommended for practice (crimper, tester, screwdrivers)']),
    resources: J(['42 HD video lessons', '13 downloadable PDF manuals', 'Quotation & maintenance contract templates', 'Cable sizing charts', 'Installation checklists', 'Certificate of completion', 'Optional hands-on practical day']),
    difficulty: 'BEGINNER', durationHours: 32, priceCents: 14900, practicalFeeCents: 6000,
    isPublished: true, categoryId: cats['security-systems'], instructorId: tapiwa,
  });

  const moduleDefs = [
    ['Introduction', 'Welcome, how the course works, tools of the trade.'],
    ['CCTV Fundamentals', 'How surveillance systems work end-to-end.'],
    ['Camera Types', 'Dome, bullet, PTZ, turret; analogue vs IP; resolution and lenses.'],
    ['DVR & NVR', 'Recorders, storage sizing, RAID, configuration.'],
    ['Cabling', 'Coax, Cat6, connectors, termination, testing.'],
    ['Installation', 'Site survey, mounting, powering, weatherproofing.'],
    ['Networking', 'IP addressing, switches, PoE, port forwarding basics.'],
    ['Remote Viewing', 'Mobile apps, P2P, DDNS, secure remote access.'],
    ['AI CCTV', 'Smart analytics: intrusion, line-cross, face & plate recognition.'],
    ['Solar CCTV', 'Panel and battery sizing for off-grid camera systems.'],
    ['Troubleshooting', 'Systematic fault-finding and preventative maintenance.'],
    ['Business Skills', 'Quoting, contracts, marketing your installation business.'],
    ['Final Practical Assessment', 'Final exam and hands-on assessment briefing.'],
  ];
  const lessonTitles = [
    ['Welcome to the course', 'Your toolkit as an installer', 'How certification works'],
    ['What is a CCTV system?', 'Signal flow: camera to screen', 'Quiz: Fundamentals'],
    ['Camera form factors explained', 'Analogue vs IP cameras', 'Resolution, lenses & IR', 'Quiz: Camera types'],
    ['DVR vs NVR', 'Hard drive & storage sizing', 'Recorder setup walkthrough', 'Assignment: Storage plan'],
    ['Coaxial cable & BNC termination', 'Cat6 & RJ45 termination', 'Cable testing', 'Quiz: Cabling'],
    ['Site survey & camera placement', 'Mounting & powering cameras', 'Weatherproofing & finishing', 'Assignment: Site survey'],
    ['IP addressing for installers', 'Switches & PoE budgets', 'Quiz: Networking'],
    ['Mobile viewing apps', 'P2P, DDNS & static IPs', 'Securing remote access'],
    ['AI analytics overview', 'Configuring smart events', 'Face & plate recognition'],
    ['Solar sizing for CCTV', 'Batteries & charge controllers', 'Assignment: Solar CCTV design'],
    ['Fault-finding methodology', 'Top 12 faults & fixes', 'Quiz: Troubleshooting'],
    ['Pricing & quotations', 'Maintenance contracts', 'Winning clients'],
    ['Final exam', 'Practical assessment briefing', 'Course summary & next steps'],
  ];

  const cctvLessonIds = [];
  for (let m = 0; m < moduleDefs.length; m++) {
    const mod = await ins('Module', { courseId: cctv, order: m + 1, title: `Module ${m + 1} — ${moduleDefs[m][0]}`, summary: moduleDefs[m][1] });
    for (let l = 0; l < lessonTitles[m].length; l++) {
      const t = lessonTitles[m][l];
      const isQuiz = t.startsWith('Quiz') || t === 'Final exam';
      const isAssign = t.startsWith('Assignment');
      const lessonId = await ins('Lesson', {
        moduleId: mod, order: l + 1, title: t,
        kind: isQuiz ? 'QUIZ' : isAssign ? 'ASSIGNMENT' : m === 12 && l === 2 ? 'SUMMARY' : 'VIDEO',
        estMinutes: isQuiz ? 15 : 12, isFreePreview: m === 0,
        contentHtml: `<p>${moduleDefs[m][1]}</p><p>Watch the video, download the notes below, then mark the lesson complete. Use the discussion tab if anything is unclear — your instructor replies within 24 hours.</p>`,
        videoUrl: isQuiz || isAssign ? null : 'https://videos.smarttech.academy/placeholder.mp4',
      });
      cctvLessonIds.push(lessonId);
      if (!isQuiz && !isAssign) {
        await ins('LessonAttachment', { lessonId, name: `${moduleDefs[m][0]} — Notes.pdf`, kind: 'PDF', fileUrl: '/files/notes.pdf', sizeKb: 840 });
        if (l === 0) await ins('LessonAttachment', { lessonId, name: `${moduleDefs[m][0]} — Slides.pptx`, kind: 'PPTX', fileUrl: '/files/slides.pptx', sizeKb: 2300 });
      }
      if (isQuiz) {
        const quizId = await ins('Quiz', { lessonId, title: t, passMarkPct: 70, isFinalExam: t === 'Final exam', timeLimitMin: t === 'Final exam' ? 60 : null });
        const qs = [
          ['MCQ', 'Which cable is standard for analogue HD cameras?', ['Cat6', 'RG59 coaxial', 'Fibre optic', 'Speaker wire'], [1]],
          ['TRUE_FALSE', 'An NVR records footage from IP cameras.', ['True', 'False'], [0]],
          ['MCQ', 'PoE stands for…', ['Power over Ethernet', 'Point of Entry', 'Power on Edge', 'Passive optical Ethernet'], [0]],
          ['FILL_BLANK', 'A camera’s field of view is determined mainly by its ____ .', [], ['lens', 'lens focal length', 'focal length']],
        ];
        for (let q = 0; q < qs.length; q++) {
          await ins('Question', { quizId, order: q + 1, kind: qs[q][0], prompt: qs[q][1], options: J(qs[q][2]), answer: J(qs[q][3]) });
        }
      }
      if (isAssign) {
        await ins('Assignment', { lessonId, title: t.replace('Assignment: ', ''), brief: 'Complete the task described in the lesson and upload photos or a PDF of your work. Your instructor will grade it and leave feedback.' });
      }
    }
  }

  // ---- Additional courses ----
  const extras = [
    ['solar-installation-professional', 'Professional Solar Installation', 'Design and install residential & commercial solar PV systems.', 'solar', rudo, 'INTERMEDIATE', 28, 17900],
    ['networking-for-technicians', 'Networking for Field Technicians', 'IP networks, switches, Wi-Fi and fibre basics for installers.', 'networking', tapiwa, 'BEGINNER', 18, 9900],
    ['electric-fence-installation', 'Electric Fence Installation', 'Energizers, zones, compliance and commissioning.', 'security-systems', tapiwa, 'BEGINNER', 14, 11900],
    ['plc-programming-fundamentals', 'PLC Programming Fundamentals', 'Ladder logic, sensors and industrial control with hands-on labs.', 'industrial-automation', rudo, 'INTERMEDIATE', 24, 19900],
    ['ai-cctv-computer-vision', 'AI CCTV & Computer Vision', 'Deploy AI analytics and NVIDIA Jetson-based smart surveillance.', 'artificial-intelligence', tapiwa, 'ADVANCED', 20, 24900],
    ['technician-business-startup', 'Start & Grow Your Technician Business', 'Pricing, quotes, marketing and contracts for trade businesses.', 'business-skills', rudo, 'BEGINNER', 10, 7900],
  ];
  const extraIds = [];
  for (const [slug, title, subtitle, cat, instr, diff, hrs, price] of extras) {
    const c = await ins('Course', {
      slug, title, subtitle,
      description: subtitle + ' A practical, project-based programme with downloadable templates, quizzes and a verifiable certificate.',
      objectives: J(['Master the core skills through real projects', 'Work with professional templates and checklists', 'Earn a verifiable certificate']),
      requirements: J(['No prior experience required']),
      resources: J(['HD video lessons', 'Downloadable notes & templates', 'Quizzes & assignments', 'Certificate of completion']),
      difficulty: diff, durationHours: hrs, priceCents: price, practicalFeeCents: 5000,
      isPublished: true, categoryId: cats[cat], instructorId: instr,
    });
    extraIds.push(c);
    const mod = await ins('Module', { courseId: c, order: 1, title: 'Module 1 — Getting Started', summary: 'Orientation and fundamentals.' });
    const firstLesson = await ins('Lesson', { moduleId: mod, order: 1, title: 'Welcome & course roadmap', kind: 'VIDEO', isFreePreview: true, estMinutes: 8, contentHtml: '<p>Welcome! Here’s how the course is structured and what you’ll build.</p>', videoUrl: 'https://videos.smarttech.academy/placeholder.mp4' });
    if (slug === 'networking-for-technicians') {
      await ins('LessonProgress', { userId: student, lessonId: firstLesson, completed: true, completedAt: new Date(Date.now() - 21 * 86400000) });
    }
  }

  // ---- Reviews ----
  await ins('Review', { userId: student, courseId: cctv, rating: 5, comment: 'Best money I’ve spent on my career. I did the Harare practical day and got hired two weeks later.' });
  for (const [name, rating, comment] of [
    ['Blessing M.', 5, 'Very practical. The cabling module alone paid for the course — my terminations are now perfect.'],
    ['Nyasha K.', 4, 'Clear videos and great templates. I use the quotation template with every client.'],
    ['Thabo D.', 5, 'Booked the Joburg practical session. Hands-on assessment gave me real confidence on site.'],
  ]) {
    const u = await ins('User', { email: `${name.split(' ')[0].toLowerCase()}@example.com`, passwordHash: hash, name, role: 'STUDENT' });
    await ins('Review', { userId: u, courseId: cctv, rating, comment });
  }

  // ---- Practical sessions ----
  const now = Date.now();
  const day = 86400000;
  const sess = [];
  for (const [courseId, city, venue, country, inDays, price] of [
    [cctv, 'Harare', 'SmartTech Training Centre, 12 Samora Machel Ave', 'Zimbabwe', 14, 6000],
    [cctv, 'Bulawayo', 'NUST Innovation Hub', 'Zimbabwe', 28, 6000],
    [cctv, 'Johannesburg', 'Midrand Technical Campus', 'South Africa', 35, 9000],
    [extraIds[0], 'Harare', 'SmartTech Training Centre, 12 Samora Machel Ave', 'Zimbabwe', 21, 8000],
  ]) {
    sess.push(await ins('PracticalSession', {
      courseId, city, venue, country,
      startsAt: new Date(now + inDays * day), endsAt: new Date(now + inDays * day + 8 * 3600000),
      capacity: 12, priceCents: price,
    }));
  }

  // ---- Demo student state ----
  await ins('Enrollment', { userId: student, courseId: cctv, progressPct: 38 });
  await ins('Enrollment', { userId: student, courseId: extraIds[1], progressPct: 100, status: 'COMPLETED', completedAt: new Date(now - 20 * day) });
  for (let i = 0; i < 16; i++) {
    await ins('LessonProgress', { userId: student, lessonId: cctvLessonIds[i], completed: true, completedAt: new Date(now - (16 - i) * day) });
  }
  await ins('Certificate', { serial: 'STA-2026-000117', userId: student, courseId: extraIds[1], hoursCompleted: 18 });
  await ins('PracticalBooking', { sessionId: sess[0], userId: student, status: 'CONFIRMED', slipCode: randomUUID() });
  await ins('Payment', { userId: student, amountCents: 14900, provider: 'ECOCASH', purpose: 'COURSE', status: 'PAID', reference: randomUUID() });

  // ---- Badges ----
  for (const [key, name, description, icon] of [
    ['first-lesson', 'First Steps', 'Completed your first lesson', '🥇'],
    ['streak-7', 'On Fire', '7-day learning streak', '🔥'],
    ['quiz-ace', 'Quiz Ace', 'Scored 100% on a quiz', '🎯'],
    ['first-cert', 'Certified', 'Earned your first certificate', '📜'],
    ['practical-pro', 'Hands-On Pro', 'Completed a practical session', '🛠️'],
  ]) {
    const b = await ins('Badge', { key, name, description, icon });
    if (['first-lesson', 'quiz-ace', 'first-cert'].includes(key)) await ins('UserBadge', { userId: student, badgeId: b });
  }

  // ---- Forum, notifications, coupon ----
  const thread = await ins('ForumThread', { courseId: cctv, title: 'Best budget cable tester?', pinned: true });
  await ins('ForumPost', { threadId: thread, userId: student, body: 'Which cable tester do you recommend for someone starting out?', likes: 4 });
  await ins('ForumPost', { threadId: thread, userId: tapiwa, body: 'A basic RJ45/BNC continuity tester is fine to start (~$10). Upgrade to a tester with PoE detection once you do IP jobs.', likes: 11, isAnswer: true });

  await ins('Notification', { userId: student, kind: 'PRACTICAL_REMINDER', title: 'Practical session confirmed', body: 'Harare · SmartTech Training Centre. Bring closed shoes and your toolkit.', href: '/practicals' });
  await ins('Notification', { userId: student, kind: 'COURSE_UPDATE', title: 'New lesson added', body: 'Module 9: Configuring smart events was updated with new footage.', href: '/courses/cctv-installation-technician' });

  await ins('Coupon', { code: 'LAUNCH25', percentOff: 25, maxUses: 500 });

  await backfillLessonContent();

  console.log('Seed complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });

