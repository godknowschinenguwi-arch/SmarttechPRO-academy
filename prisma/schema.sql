-- SmartTech Academy — SQLite DDL (mirrors prisma/schema.prisma)
-- In production, use Postgres via Prisma: `prisma db push` with provider "postgresql".

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL,
  name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'STUDENT',
  avatarUrl TEXT, headline TEXT, bio TEXT, city TEXT, country TEXT,
  xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1,
  streakDays INTEGER NOT NULL DEFAULT 0,
  lastActiveAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, icon TEXT
);

CREATE TABLE IF NOT EXISTS Course (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, subtitle TEXT,
  description TEXT NOT NULL, objectives TEXT NOT NULL, requirements TEXT NOT NULL,
  resources TEXT NOT NULL, imageUrl TEXT, previewVideoUrl TEXT,
  difficulty TEXT NOT NULL DEFAULT 'BEGINNER', durationHours REAL NOT NULL DEFAULT 0,
  priceCents INTEGER NOT NULL DEFAULT 0, practicalFeeCents INTEGER NOT NULL DEFAULT 0,
  isPublished INTEGER NOT NULL DEFAULT 0, certificateEnabled INTEGER NOT NULL DEFAULT 1,
  categoryId TEXT NOT NULL REFERENCES Category(id),
  instructorId TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Module (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT, "order" INTEGER NOT NULL,
  courseId TEXT NOT NULL REFERENCES Course(id) ON DELETE CASCADE,
  UNIQUE (courseId, "order")
);

CREATE TABLE IF NOT EXISTS Lesson (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, "order" INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'VIDEO', videoUrl TEXT, contentHtml TEXT,
  estMinutes INTEGER NOT NULL DEFAULT 10, isFreePreview INTEGER NOT NULL DEFAULT 0,
  moduleId TEXT NOT NULL REFERENCES Module(id) ON DELETE CASCADE,
  UNIQUE (moduleId, "order")
);

CREATE TABLE IF NOT EXISTS LessonAttachment (
  id TEXT PRIMARY KEY, lessonId TEXT NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE,
  name TEXT NOT NULL, kind TEXT NOT NULL, fileUrl TEXT NOT NULL, sizeKb INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Review (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id),
  courseId TEXT NOT NULL REFERENCES Course(id), rating INTEGER NOT NULL, comment TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (userId, courseId)
);

CREATE TABLE IF NOT EXISTS Enrollment (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id),
  courseId TEXT NOT NULL REFERENCES Course(id), status TEXT NOT NULL DEFAULT 'ACTIVE',
  progressPct REAL NOT NULL DEFAULT 0,
  startedAt TEXT NOT NULL DEFAULT (datetime('now')), completedAt TEXT,
  UNIQUE (userId, courseId)
);

CREATE TABLE IF NOT EXISTS LessonProgress (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id),
  lessonId TEXT NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0, secondsWatched INTEGER NOT NULL DEFAULT 0,
  bookmarked INTEGER NOT NULL DEFAULT 0, completedAt TEXT,
  UNIQUE (userId, lessonId)
);

CREATE TABLE IF NOT EXISTS Quiz (
  id TEXT PRIMARY KEY, lessonId TEXT UNIQUE NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE,
  title TEXT NOT NULL, passMarkPct INTEGER NOT NULL DEFAULT 70,
  timeLimitMin INTEGER, isFinalExam INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Question (
  id TEXT PRIMARY KEY, quizId TEXT NOT NULL REFERENCES Quiz(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL, kind TEXT NOT NULL, prompt TEXT NOT NULL, imageUrl TEXT,
  options TEXT NOT NULL, answer TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS QuizAttempt (
  id TEXT PRIMARY KEY, quizId TEXT NOT NULL REFERENCES Quiz(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES User(id), scorePct REAL NOT NULL,
  passed INTEGER NOT NULL, answers TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Assignment (
  id TEXT PRIMARY KEY, lessonId TEXT UNIQUE NOT NULL REFERENCES Lesson(id) ON DELETE CASCADE,
  title TEXT NOT NULL, brief TEXT NOT NULL,
  submitKinds TEXT NOT NULL DEFAULT 'FILE,PHOTO,VIDEO', maxPoints INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS Submission (
  id TEXT PRIMARY KEY, assignmentId TEXT NOT NULL REFERENCES Assignment(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES User(id), fileUrl TEXT NOT NULL, note TEXT,
  grade INTEGER, feedback TEXT, gradedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PracticalSession (
  id TEXT PRIMARY KEY, courseId TEXT NOT NULL REFERENCES Course(id),
  city TEXT NOT NULL, venue TEXT NOT NULL, country TEXT NOT NULL DEFAULT 'Zimbabwe',
  startsAt TEXT NOT NULL, endsAt TEXT NOT NULL, capacity INTEGER NOT NULL DEFAULT 12,
  priceCents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS PracticalBooking (
  id TEXT PRIMARY KEY, sessionId TEXT NOT NULL REFERENCES PracticalSession(id),
  userId TEXT NOT NULL REFERENCES User(id), status TEXT NOT NULL DEFAULT 'CONFIRMED',
  attendance INTEGER NOT NULL DEFAULT 0, assessmentScore INTEGER,
  slipCode TEXT UNIQUE NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (sessionId, userId)
);

CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id),
  amountCents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'USD',
  provider TEXT NOT NULL, purpose TEXT NOT NULL, reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', couponCode TEXT,
  meta TEXT, pollUrl TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Coupon (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, percentOff INTEGER NOT NULL,
  maxUses INTEGER NOT NULL DEFAULT 100, usedCount INTEGER NOT NULL DEFAULT 0,
  expiresAt TEXT, active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Certificate (
  id TEXT PRIMARY KEY, serial TEXT UNIQUE NOT NULL, kind TEXT NOT NULL DEFAULT 'COURSE',
  userId TEXT NOT NULL REFERENCES User(id), courseId TEXT NOT NULL REFERENCES Course(id),
  hoursCompleted REAL NOT NULL, issuedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ForumThread (
  id TEXT PRIMARY KEY, courseId TEXT NOT NULL REFERENCES Course(id),
  title TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ForumPost (
  id TEXT PRIMARY KEY, threadId TEXT NOT NULL REFERENCES ForumThread(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES User(id), body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0, isAnswer INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Message (
  id TEXT PRIMARY KEY, senderId TEXT NOT NULL REFERENCES User(id),
  recipientId TEXT NOT NULL REFERENCES User(id), body TEXT NOT NULL, readAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id), kind TEXT NOT NULL,
  title TEXT NOT NULL, body TEXT NOT NULL, href TEXT, readAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Badge (
  id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  description TEXT NOT NULL, icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS UserBadge (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id),
  badgeId TEXT NOT NULL REFERENCES Badge(id),
  earnedAt TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (userId, badgeId)
);

CREATE TABLE IF NOT EXISTS Favorite (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES User(id),
  courseId TEXT NOT NULL REFERENCES Course(id), UNIQUE (userId, courseId)
);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY, userId TEXT, action TEXT NOT NULL, detail TEXT, ip TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_course_category ON Course(categoryId);
CREATE INDEX IF NOT EXISTS idx_lesson_module ON Lesson(moduleId);
CREATE INDEX IF NOT EXISTS idx_enrollment_user ON Enrollment(userId);
CREATE INDEX IF NOT EXISTS idx_progress_user ON LessonProgress(userId);
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId);
