import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем .env из корня проекта
config({ path: resolve(__dirname, '../../../.env') });
import { db, users, userRoles } from './index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i++) {
    const [k, v] = process.argv[i].split('=');
    if (k && v) args.set(k.replace(/^--/, ''), v);
  }
  const email = args.get('email');
  const name = args.get('name') || '';
  const role = (args.get('role') || 'SUPERADMIN') as 'PLAYER'|'MASTER'|'MODERATOR'|'SUPERADMIN';
  const password = args.get('password');
  if (!email || !password) {
    console.error('Usage: tsx src/create_user.ts --email=user@example.com --password=Secret123! [--name="Name"] [--role=SUPERADMIN]');
    process.exit(2);
  }

  const hash = bcrypt.hashSync(password, 10);
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let user = existing[0];
  if (user) {
    const upd = await db.update(users).set({ passwordHash: hash, name: name || user.name || null }).where(eq(users.id, user.id)).returning();
    user = upd[0];
    console.log('✅ Updated user password:', email);
  } else {
    const created = await db.insert(users).values({ email, name, passwordHash: hash }).returning();
    user = created[0];
    console.log('✅ Created user:', email);
  }

  const existingRoles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
  if (!existingRoles.find(r => r.role === role)) {
    await db.insert(userRoles).values({ userId: user.id, role });
    console.log('✅ Assigned role:', role);
  } else {
    console.log('✓ Role already present:', role);
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});



