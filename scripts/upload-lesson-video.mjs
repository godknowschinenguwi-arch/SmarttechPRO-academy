#!/usr/bin/env node
// Uploads a local video file to Bunny Stream and attaches its playback URL to a Lesson.
//
// Usage:
//   node scripts/upload-lesson-video.mjs --list [courseSlug]        List lessons and their IDs
//   node scripts/upload-lesson-video.mjs <lessonId> <videoFile> [title]
//
// Requires BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY and BUNNY_STREAM_PULL_ZONE
// (see src/lib/bunnyStream.ts for setup steps) and DATABASE_URL for the target
// database — defaults to the local dev SQLite file, same as prisma/seed.mjs.
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const db = createClient({
  url: process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')
    ? process.env.DATABASE_URL
    : `file:${path.join(here, '..', 'prisma', 'dev.db')}`,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

async function listLessons(courseSlug) {
  const rows = courseSlug
    ? await db.execute({
        sql: `SELECT l.id, l.title, c.slug AS courseSlug FROM Lesson l
              JOIN Module m ON m.id = l.moduleId JOIN Course c ON c.id = m.courseId
              WHERE c.slug = ? ORDER BY m."order", l."order"`,
        args: [courseSlug],
      })
    : await db.execute(
        `SELECT l.id, l.title, c.slug AS courseSlug FROM Lesson l
         JOIN Module m ON m.id = l.moduleId JOIN Course c ON c.id = m.courseId
         ORDER BY c.slug, m."order", l."order"`);
  for (const r of rows.rows) console.log(`${r.id}  [${r.courseSlug}]  ${r.title}`);
}

async function uploadAndAttach(lessonId, filePath, titleArg) {
  const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
  const API_KEY = process.env.BUNNY_STREAM_API_KEY;
  const PULL_ZONE = process.env.BUNNY_STREAM_PULL_ZONE;
  if (!LIBRARY_ID || !API_KEY || !PULL_ZONE) {
    console.error('Set BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY and BUNNY_STREAM_PULL_ZONE first (see src/lib/bunnyStream.ts).');
    process.exit(1);
  }
  const API_BASE = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`;

  const lesson = await db.execute({ sql: 'SELECT id, title FROM Lesson WHERE id = ?', args: [lessonId] });
  if (!lesson.rows[0]) {
    console.error(`No lesson found with id ${lessonId}. Run with --list to find one.`);
    process.exit(1);
  }
  const title = titleArg || lesson.rows[0].title;

  console.log(`Creating Bunny Stream video "${title}"...`);
  const createRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { AccessKey: API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
  const { guid } = await createRes.json();
  console.log(`Created video ${guid}. Uploading ${filePath}...`);

  const body = readFileSync(filePath);
  const uploadRes = await fetch(`${API_BASE}/${guid}`, {
    method: 'PUT',
    headers: { AccessKey: API_KEY, 'Content-Type': 'application/octet-stream' },
    body,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);

  console.log('Uploaded. Waiting for Bunny to finish transcoding...');
  let status = 0;
  for (let i = 0; i < 60; i++) {
    const statusRes = await fetch(`${API_BASE}/${guid}`, { headers: { AccessKey: API_KEY } });
    const data = await statusRes.json();
    status = data.status;
    if (status === 4) break; // Finished
    if (status === 5) throw new Error('Bunny reported a transcoding error for this video.');
    process.stdout.write(`  status=${status} encodeProgress=${data.encodeProgress ?? 0}%\r`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (status !== 4) {
    console.log("\nStill transcoding — Bunny will keep processing it; re-run this script later to check, or check the Bunny dashboard.");
  }

  const playbackUrl = `https://${PULL_ZONE}/${guid}/playlist.m3u8`;
  await db.execute({ sql: 'UPDATE Lesson SET videoUrl = ? WHERE id = ?', args: [playbackUrl, lessonId] });
  console.log(`\nDone. Lesson ${lessonId} now points at:\n  ${playbackUrl}`);
}

const [, , a, b, c] = process.argv;
try {
  if (!a || a === '--list') {
    await listLessons(b);
  } else {
    await uploadAndAttach(a, b, c);
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
