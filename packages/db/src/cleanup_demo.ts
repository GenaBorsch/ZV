import 'dotenv/config';
import { db, users, userRoles, products, groups, sessions, reports, ruleDocs, masterProfiles, playerProfiles, characters, groups as groupsTbl, groupMembers } from './index';
import { ilike, inArray } from 'drizzle-orm';

async function main() {
  // delete demo users and roles
  const demoEmails = ['demoadmin@zvezdnoe-vereteno.ru','demomoderator@zvezdnoe-vereteno.ru','demomaster@zvezdnoe-vereteno.ru','demoplayer@zvezdnoe-vereteno.ru','master@zvezdnoe-vereteno.ru','player@zvezdnoe-vereteno.ru','moderator@zvezdnoe-vereteno.ru'];
  // find users by demo prefix or listed emails
  const toDeleteUsers = await db.select().from(users).where(ilike(users.email, 'demo%'));
  const ids = toDeleteUsers.map(u => u.id);
  // cascade delete related via FKs; user_roles will cascade by code elsewhere or rely on ON DELETE CASCADE
  if (ids.length > 0) {
    // delete related profiles/characters/groupMembers simplistic (if not cascade)
    await db.delete(userRoles).where(inArray(userRoles.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
  }
  console.log('✅ Demo users cleaned (if existed)');
}

main().catch((e) => {
  console.error('❌ Error cleanup:', e);
  process.exit(1);
});



