// Idempotent demo seed for Herbal Wisdom Africa.
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
const db = createClient({
  url: url.startsWith('file:./') ? `file:${path.join(process.cwd(), url.slice(7))}` : url,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

async function applySchema() {
  const ddl = readFileSync(path.join(process.cwd(), 'prisma', 'schema.sql'), 'utf8');
  const statements = ddl.split(';').map((s) => s.trim()).filter(Boolean);
  for (const s of statements) {
    await db.execute(s);
  }
}

async function get(sql, args = []) {
  const res = await db.execute({ sql, args });
  return res.rows[0] ?? null;
}

async function insert(table, row) {
  const keys = Object.keys(row);
  const cols = keys.map((k) => `"${k}"`).join(', ');
  const marks = keys.map(() => '?').join(', ');
  await db.execute({ sql: `INSERT INTO ${table} (${cols}) VALUES (${marks})`, args: keys.map((k) => row[k]) });
}

async function ensureUser({ email, name, password, role, country, bio }) {
  const existing = await get('SELECT id FROM User WHERE email = ?', [email]);
  if (existing) return existing.id;
  const id = randomUUID();
  await insert('User', {
    id,
    email,
    name,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    country,
    bio: bio ?? null,
  });
  return id;
}

async function ensureRemedy(authorId, data) {
  const existing = await get('SELECT id FROM Remedy WHERE authorId = ? AND herbName = ? AND condition = ?', [
    authorId,
    data.herbName,
    data.condition,
  ]);
  if (existing) return existing.id;
  const id = randomUUID();
  await insert('Remedy', { id, authorId, status: 'PUBLISHED', ...data });
  return id;
}

async function ensureComment(remedyId, authorId, body) {
  const existing = await get('SELECT id FROM Comment WHERE remedyId = ? AND authorId = ? AND body = ?', [
    remedyId,
    authorId,
    body,
  ]);
  if (existing) return existing.id;
  const id = randomUUID();
  await insert('Comment', { id, remedyId, authorId, body, status: 'PUBLISHED' });
  return id;
}

async function ensureFlag(targetType, targetId, reporterId, reason) {
  const existing = await get('SELECT id FROM Flag WHERE targetType = ? AND targetId = ? AND reporterId = ?', [
    targetType,
    targetId,
    reporterId,
  ]);
  if (existing) return existing.id;
  const id = randomUUID();
  await insert('Flag', { id, targetType, targetId, reporterId, reason, status: 'OPEN' });
  return id;
}

async function main() {
  await applySchema();

  const admin = await ensureUser({
    email: 'admin@herbalwisdom.africa',
    name: 'Admin',
    password: 'Password123!',
    role: 'ADMIN',
    country: 'Zimbabwe',
    bio: 'Community moderator.',
  });

  const thandiwe = await ensureUser({
    email: 'thandiwe@herbalwisdom.africa',
    name: 'Thandiwe Moyo',
    password: 'Password123!',
    role: 'MEMBER',
    country: 'Zimbabwe',
    bio: 'Grew up learning herbs from my grandmother in Mutare.',
  });

  const kwame = await ensureUser({
    email: 'kwame@herbalwisdom.africa',
    name: 'Kwame Boateng',
    password: 'Password123!',
    role: 'MEMBER',
    country: 'Ghana',
    bio: 'Interested in traditional Akan plant medicine.',
  });

  const amara = await ensureUser({
    email: 'amara@herbalwisdom.africa',
    name: 'Amara Nwosu',
    password: 'Password123!',
    role: 'MEMBER',
    country: 'Nigeria',
    bio: 'Herbal gardener and home remedy enthusiast.',
  });

  const zola = await ensureUser({
    email: 'zola@herbalwisdom.africa',
    name: 'Zola Dlamini',
    password: 'Password123!',
    role: 'MEMBER',
    country: 'South Africa',
    bio: null,
  });

  const r1 = await ensureRemedy(thandiwe, {
    herbName: 'African Wormwood',
    herbLocalName: 'Umhlonyane',
    condition: 'Common cold & flu symptoms',
    region: 'Zimbabwe',
    preparation:
      'Steep a handful of fresh or dried leaves in boiling water for 10 minutes, covered. Strain before drinking.',
    dosage: 'One cup, 2–3 times a day for up to 5 days.',
    outcome:
      'My grandmother made this for us every time we had a blocked nose or fever growing up. I still make it today — it helps me feel less congested and I sleep better while I have a cold. It is bitter, so I add a little honey.',
  });
  await ensureComment(r1, kwame, 'We have something similar in Ghana with a different bitter leaf — the steam alone from the hot tea seems to help with the congestion.');
  await ensureComment(r1, amara, 'Good to know the dosage you use — I always just guessed. Thank you for sharing this.');

  const r2 = await ensureRemedy(amara, {
    herbName: 'Moringa',
    herbLocalName: 'Ewe Igbale (Yoruba, regional)',
    condition: 'Low energy & general fatigue',
    region: 'Nigeria',
    preparation: 'Dry moringa leaves in the shade, crush into a powder, and stir a spoonful into soup, oats, or hot water.',
    dosage: 'One teaspoon of powder daily, usually in the morning.',
    outcome:
      'I started adding moringa powder to my breakfast about a year ago after a neighbour recommended it. I have noticed I feel more energetic through the day. It could be the better breakfast habit overall, but the moringa is the main change I made.',
  });
  await ensureComment(r2, zola, 'I grow moringa in my garden too — the leaves also work well dried and added to stews.');

  const r3 = await ensureRemedy(zola, {
    herbName: 'Aloe Vera',
    herbLocalName: 'Inhlaba',
    condition: 'Minor burns & skin irritation',
    region: 'South Africa',
    preparation: 'Cut a fresh leaf, split it open, and apply the clear gel directly to clean, cooled skin.',
    dosage: 'Apply a thin layer 2–3 times a day until the skin looks better.',
    outcome:
      'I keep an aloe plant on my windowsill just for kitchen burns. Applying the gel straight away seems to calm the sting and I have had less peeling afterwards compared to when I do nothing. I do not use it on deep or serious burns — those need a clinic.',
  });
  await ensureComment(r3, thandiwe, 'Same experience here — just for small everyday burns though, agreed on seeing a doctor for anything serious.');

  const r4 = await ensureRemedy(kwame, {
    herbName: 'Ginger',
    herbLocalName: 'Ginger root',
    condition: 'Nausea & upset stomach',
    region: 'Ghana',
    preparation: 'Slice fresh ginger root thinly and simmer in water for 10–15 minutes.',
    dosage: 'Small cup after meals when needed.',
    outcome:
      'Ginger tea has been the go-to in my family for an upset stomach or travel sickness for as long as I can remember. It settles my stomach within maybe 20–30 minutes. I would still see a doctor if the discomfort does not go away or gets worse.',
  });

  const r5 = await ensureRemedy(thandiwe, {
    herbName: 'Hibiscus (Sorrel/Zobo)',
    herbLocalName: 'Zobo',
    condition: 'Mild high blood pressure support (alongside medication)',
    region: 'Zimbabwe',
    preparation: 'Boil dried hibiscus calyces in water for about 10 minutes, strain, and cool. Sweeten lightly if desired.',
    dosage: 'One glass, once a day.',
    outcome:
      'I drink hibiscus tea regularly alongside the blood pressure medication my doctor prescribed. My readings have been steadier since I made it a daily habit, though I cannot say for certain how much is the tea versus the medication and diet changes. I would not recommend stopping any prescribed medication for this.',
  });
  await ensureComment(r5, amara, "Important that you mention this is alongside medication, not instead of it. Thanks for being clear about that.");

  const r6 = await ensureRemedy(amara, {
    herbName: 'Miracle Cure Root',
    condition: 'Cancer',
    region: 'Nigeria',
    preparation: 'Grind the root into a powder and mix with water.',
    dosage: 'As much as possible, every day.',
    outcome: 'This completely cured my relative\'s cancer in two weeks, no need for chemotherapy or doctors at all, it works better than any hospital treatment.',
  });
  await ensureComment(r6, zola, 'This sounds dangerous — please do not tell people to skip chemotherapy, reporting this post.');
  await ensureFlag('REMEDY', r6, zola, 'Unverified claim discouraging people from seeking cancer treatment — potentially dangerous misinformation.');
  await ensureFlag('COMMENT', await ensureComment(r6, zola, 'This sounds dangerous — please do not tell people to skip chemotherapy, reporting this post.'), thandiwe, 'Flagging for admin visibility, agree with the concern raised.');

  console.log('Seed complete.');
  console.log('Demo accounts (password: Password123!):');
  console.log('  admin@herbalwisdom.africa (ADMIN)');
  console.log('  thandiwe@herbalwisdom.africa, kwame@herbalwisdom.africa, amara@herbalwisdom.africa, zola@herbalwisdom.africa (MEMBER)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
