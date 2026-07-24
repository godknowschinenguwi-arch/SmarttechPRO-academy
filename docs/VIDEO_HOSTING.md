# Lesson video hosting — Bunny Stream

Lesson videos are played by `src/components/VideoPlayer.tsx`, a real HTML5/HLS
player (adaptive bitrate via `hls.js`, resume-from-last-position, real
progress tracking). It plays whatever URL is in `Lesson.videoUrl` — an HLS
`.m3u8` playlist or a plain `.mp4`. This doc covers getting real videos onto
Bunny Stream and pointing lessons at them.

Why Bunny Stream: predictable low cost (~$0.005/GB storage + delivery),
built-in adaptive-bitrate HLS (meaningfully cheaper mobile data usage for
students), and signed/expiring playback URLs so videos aren't freely
downloadable or hotlinkable.

## 1. Create a Stream library

1. Sign up at [bunny.net](https://bunny.net) → **Stream** → **Add Video Library**.
2. Open the library → **API** tab → copy the **Video Library API Key**.
3. Note the **Library ID** (shown in the library's URL/settings) and the pull
   zone hostname it generates under **General** (looks like `vz-xxxxxxx.b-cdn.net`).
4. Optional but recommended before real students arrive: **Security** tab →
   enable **Token Authentication** and copy its key, so playback URLs expire
   and can't be shared outside the platform.

## 2. Set environment variables

```bash
BUNNY_STREAM_LIBRARY_ID="..."
BUNNY_STREAM_API_KEY="..."
BUNNY_STREAM_PULL_ZONE="vz-xxxxxxx.b-cdn.net"
BUNNY_STREAM_TOKEN_AUTH_KEY="..."   # optional — only if Token Authentication is enabled
```

Add these locally in `.env.local` and on your deploy host (Vercel: Settings →
Environment Variables) the same way `AUTH_SECRET` and `DATABASE_URL` are set.

## 3. Upload a video and attach it to a lesson

Find the lesson you want to attach a video to:

```bash
node scripts/upload-lesson-video.mjs --list                          # every lesson
node scripts/upload-lesson-video.mjs --list cctv-installation-technician   # one course
```

Then upload and attach:

```bash
node scripts/upload-lesson-video.mjs <lessonId> ~/videos/module-3-lesson-2.mp4
```

This creates the video on Bunny, uploads the file, waits for transcoding to
finish, and writes the resulting HLS playback URL into that lesson's
`videoUrl` — students see it immediately, no redeploy needed.

## 4. Notes

- `src/lib/bunnyStream.ts` has the same create/upload/status/playback-URL
  logic as a library, for building an in-app upload flow later (e.g. from an
  instructor course builder) instead of the CLI script.
- The token-authentication signing in `playbackUrl()` follows Bunny's
  documented convention but hasn't been exercised against a live account yet
  — cross-check it against Bunny's dashboard example the first time you
  enable Token Authentication, and flag it if URLs come back invalid.
- Until real footage exists, leave the Bunny env vars unset — lessons will
  keep pointing at their existing (non-functional) placeholder URL and the
  video block just won't render meaningfully. No error, no crash.
