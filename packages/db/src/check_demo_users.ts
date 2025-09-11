import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем .env из корня проекта
config({ path: resolve(__dirname, '../../../.env') });
import { db, users, userRoles } from './index';
import { eq, ilike } from 'drizzle-orm';

async function main() {
  console.log('🔍 Проверяю существующих демо-пользователей...');

  // Ищем всех пользователей с demo префиксом
  const demoUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(ilike(users.email, 'demo%'));

  console.log('\n📋 Найденные демо-пользователи:');
  
  if (demoUsers.length === 0) {
    console.log('   Демо-пользователи не найдены');
  } else {
    for (const user of demoUsers) {
      // Получаем роли пользователя
      const roles = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, user.id));
      
      const rolesList = roles.map(r => r.role).join(', ');
      console.log(`   📧 ${user.email}`);
      console.log(`      👤 Имя: ${user.name || 'не указано'}`);
      console.log(`      🎭 Роли: ${rolesList || 'нет ролей'}`);
      console.log(`      📅 Создан: ${user.createdAt.toLocaleDateString('ru')}`);
      console.log('');
    }
  }

  // Проверим каких пользователей нам нужно создать
  const requiredUsers = [
    'demoadmin@zvezdnoe-vereteno.ru',
    'demomoderator@zvezdnoe-vereteno.ru', 
    'demomaster@zvezdnoe-vereteno.ru',
    'demoplayer@zvezdnoe-vereteno.ru'
  ];

  const existingEmails = demoUsers.map(u => u.email);
  const missingUsers = requiredUsers.filter(email => !existingEmails.includes(email));

  console.log('🎯 Требуемые тестовые аккаунты:');
  for (const email of requiredUsers) {
    const exists = existingEmails.includes(email);
    console.log(`   ${exists ? '✅' : '❌'} ${email}`);
  }

  if (missingUsers.length > 0) {
    console.log('\n⚠️  Отсутствующие аккаунты:');
    missingUsers.forEach(email => console.log(`   - ${email}`));
  } else {
    console.log('\n✅ Все требуемые тестовые аккаунты существуют');
  }
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Завершение проверки');
    process.exit(0);
  });
