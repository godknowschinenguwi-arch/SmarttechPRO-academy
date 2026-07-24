import { all, get } from './db';

export type CourseCardData = {
  id: string; slug: string; title: string; subtitle: string | null; imageUrl: string | null;
  difficulty: string; durationHours: number; priceCents: number; comingSoon: boolean;
  categoryName: string; categoryIcon: string | null; instructorName: string;
  rating: number | null; reviewCount: number; studentCount: number;
};

const CARD_SELECT = `
  SELECT c.id, c.slug, c.title, c.subtitle, c.imageUrl, c.difficulty, c.durationHours, c.priceCents, c.comingSoon,
    cat.name AS categoryName, cat.icon AS categoryIcon, u.name AS instructorName,
    (SELECT ROUND(AVG(rating),1) FROM Review r WHERE r.courseId = c.id) AS rating,
    (SELECT COUNT(*) FROM Review r WHERE r.courseId = c.id) AS reviewCount,
    (SELECT COUNT(*) FROM Enrollment e WHERE e.courseId = c.id) AS studentCount
  FROM Course c
  JOIN Category cat ON cat.id = c.categoryId
  JOIN User u ON u.id = c.instructorId
  WHERE c.isPublished = 1`;

export function listCourses(categorySlug?: string) {
  if (categorySlug) return all<CourseCardData>(`${CARD_SELECT} AND cat.slug = ? ORDER BY comingSoon ASC, studentCount DESC`, [categorySlug]);
  return all<CourseCardData>(`${CARD_SELECT} ORDER BY comingSoon ASC, studentCount DESC`);
}

export function listCategories() {
  return all<{ id: string; name: string; slug: string; icon: string | null; courseCount: number }>(
    `SELECT cat.*, (SELECT COUNT(*) FROM Course c WHERE c.categoryId = cat.id AND c.isPublished = 1) AS courseCount
     FROM Category cat ORDER BY cat.name`
  );
}

export async function getCourse(slug: string) {
  const course = await get<any>(
    `SELECT c.*, cat.name AS categoryName, cat.slug AS categorySlug,
       u.name AS instructorName, u.headline AS instructorHeadline, u.bio AS instructorBio,
       (SELECT ROUND(AVG(rating),1) FROM Review r WHERE r.courseId = c.id) AS rating,
       (SELECT COUNT(*) FROM Review r WHERE r.courseId = c.id) AS reviewCount,
       (SELECT COUNT(*) FROM Enrollment e WHERE e.courseId = c.id) AS studentCount
     FROM Course c JOIN Category cat ON cat.id = c.categoryId JOIN User u ON u.id = c.instructorId
     WHERE c.slug = ?`, [slug]);
  if (!course) return null;
  const modules = await all<any>(`SELECT * FROM Module WHERE courseId = ? ORDER BY "order"`, [course.id]);
  const lessons = await all<any>(
    `SELECT l.* FROM Lesson l JOIN Module m ON m.id = l.moduleId WHERE m.courseId = ? ORDER BY m."order", l."order"`,
    [course.id]);
  const reviews = await all<any>(
    `SELECT r.rating, r.comment, r.createdAt, u.name AS userName FROM Review r JOIN User u ON u.id = r.userId
     WHERE r.courseId = ? ORDER BY r.createdAt DESC LIMIT 10`, [course.id]);
  const practicals = await all<any>(
    `SELECT p.*, (SELECT COUNT(*) FROM PracticalBooking b WHERE b.sessionId = p.id AND b.status != 'CANCELLED') AS booked
     FROM PracticalSession p WHERE p.courseId = ? AND p.startsAt > datetime('now') ORDER BY p.startsAt`, [course.id]);
  return { course, modules, lessons, reviews, practicals };
}

export function getEnrollment(userId: string, courseId: string) {
  return get<any>(`SELECT * FROM Enrollment WHERE userId = ? AND courseId = ?`, [userId, courseId]);
}

export async function getLessonBundle(lessonId: string) {
  const lesson = await get<any>(
    `SELECT l.*, m.title AS moduleTitle, m.courseId FROM Lesson l JOIN Module m ON m.id = l.moduleId WHERE l.id = ?`,
    [lessonId]);
  if (!lesson) return null;
  const attachments = await all<any>(`SELECT * FROM LessonAttachment WHERE lessonId = ?`, [lessonId]);
  const quiz = await get<any>(`SELECT * FROM Quiz WHERE lessonId = ?`, [lessonId]);
  const questions = quiz
    ? await all<any>(`SELECT id, "order", kind, prompt, imageUrl, options, points FROM Question WHERE quizId = ? ORDER BY "order"`, [quiz.id])
    : [];
  const assignment = await get<any>(`SELECT * FROM Assignment WHERE lessonId = ?`, [lessonId]);
  return { lesson, attachments, quiz, questions, assignment };
}

export function getUserProgressForCourse(userId: string, courseId: string) {
  return all<any>(
    `SELECT lp.lessonId, lp.completed, lp.secondsWatched FROM LessonProgress lp
     JOIN Lesson l ON l.id = lp.lessonId JOIN Module m ON m.id = l.moduleId
     WHERE lp.userId = ? AND m.courseId = ?`, [userId, courseId]);
}

export async function getStudentDashboard(userId: string) {
  const enrollments = await all<any>(
    `SELECT e.*, c.slug, c.title, c.imageUrl, c.durationHours,
       (SELECT COUNT(*) FROM Lesson l JOIN Module m ON m.id = l.moduleId WHERE m.courseId = c.id) AS lessonCount,
       (SELECT COUNT(*) FROM LessonProgress lp JOIN Lesson l ON l.id = lp.lessonId JOIN Module m ON m.id = l.moduleId
        WHERE m.courseId = c.id AND lp.userId = e.userId AND lp.completed = 1) AS doneCount
     FROM Enrollment e JOIN Course c ON c.id = e.courseId WHERE e.userId = ? ORDER BY e.startedAt DESC`, [userId]);
  const certificates = await all<any>(
    `SELECT cert.*, c.title AS courseTitle FROM Certificate cert JOIN Course c ON c.id = cert.courseId
     WHERE cert.userId = ? ORDER BY cert.issuedAt DESC`, [userId]);
  const bookings = await all<any>(
    `SELECT b.*, p.city, p.venue, p.country, p.startsAt, c.title AS courseTitle
     FROM PracticalBooking b JOIN PracticalSession p ON p.id = b.sessionId JOIN Course c ON c.id = p.courseId
     WHERE b.userId = ? AND b.status != 'CANCELLED' ORDER BY p.startsAt`, [userId]);
  const notifications = await all<any>(
    `SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 6`, [userId]);
  const badges = await all<any>(
    `SELECT b.name, b.description, b.icon, ub.earnedAt FROM UserBadge ub JOIN Badge b ON b.id = ub.badgeId
     WHERE ub.userId = ? ORDER BY ub.earnedAt DESC`, [userId]);
  const recommended = await all<CourseCardData>(
    `${CARD_SELECT} AND c.comingSoon = 0 AND c.id NOT IN (SELECT courseId FROM Enrollment WHERE userId = ?) ORDER BY studentCount DESC LIMIT 3`,
    [userId]);
  return { enrollments, certificates, bookings, notifications, badges, recommended };
}

export async function getInstructorDashboard(userId: string) {
  const courses = await all<any>(
    `SELECT c.id, c.slug, c.title, c.priceCents, c.isPublished,
       (SELECT COUNT(*) FROM Enrollment e WHERE e.courseId = c.id) AS students,
       (SELECT ROUND(AVG(rating),1) FROM Review r WHERE r.courseId = c.id) AS rating,
       (SELECT COUNT(*) FROM Enrollment e WHERE e.courseId = c.id AND e.status = 'COMPLETED') AS completed
     FROM Course c WHERE c.instructorId = ? ORDER BY students DESC`, [userId]);
  const toGrade = await all<any>(
    `SELECT s.id, s.createdAt, a.title AS assignmentTitle, u.name AS studentName, c.title AS courseTitle
     FROM Submission s JOIN Assignment a ON a.id = s.assignmentId JOIN Lesson l ON l.id = a.lessonId
     JOIN Module m ON m.id = l.moduleId JOIN Course c ON c.id = m.courseId JOIN User u ON u.id = s.userId
     WHERE c.instructorId = ? AND s.grade IS NULL ORDER BY s.createdAt`, [userId]);
  return { courses, toGrade };
}

export async function getAdminDashboard() {
  const kpi = async (sql: string) => Number((await get<any>(sql))?.n ?? 0);
  const [users, courses, enrollments, certs] = await Promise.all([
    kpi('SELECT COUNT(*) n FROM User'),
    kpi('SELECT COUNT(*) n FROM Course WHERE isPublished = 1'),
    kpi('SELECT COUNT(*) n FROM Enrollment'),
    kpi('SELECT COUNT(*) n FROM Certificate'),
  ]);
  const revenue = Number((await get<any>(`SELECT COALESCE(SUM(amountCents),0) n FROM Payment WHERE status = 'PAID'`))?.n ?? 0);
  const payments = await all<any>(
    `SELECT p.*, u.name AS userName FROM Payment p JOIN User u ON u.id = p.userId ORDER BY p.createdAt DESC LIMIT 8`);
  const sessions = await all<any>(
    `SELECT p.*, c.title AS courseTitle,
       (SELECT COUNT(*) FROM PracticalBooking b WHERE b.sessionId = p.id AND b.status != 'CANCELLED') AS booked
     FROM PracticalSession p JOIN Course c ON c.id = p.courseId ORDER BY p.startsAt LIMIT 8`);
  return { users, courses, enrollments, certs, revenue, payments, sessions };
}

export function getCertificate(serial: string) {
  return get<any>(
    `SELECT cert.*, u.name AS studentName, c.title AS courseTitle, i.name AS instructorName
     FROM Certificate cert JOIN User u ON u.id = cert.userId JOIN Course c ON c.id = cert.courseId
     JOIN User i ON i.id = c.instructorId WHERE cert.serial = ?`, [serial]);
}

export function listPracticalSessions() {
  return all<any>(
    `SELECT p.*, c.title AS courseTitle, c.slug AS courseSlug,
       (SELECT COUNT(*) FROM PracticalBooking b WHERE b.sessionId = p.id AND b.status != 'CANCELLED') AS booked
     FROM PracticalSession p JOIN Course c ON c.id = p.courseId
     WHERE p.startsAt > datetime('now') ORDER BY p.startsAt`);
}
