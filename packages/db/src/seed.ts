import { db } from './index';

async function main() {
  console.log('🌱 Seed режим без тестовых данных: ничего не создаётся.');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Закрываю соединение с базой данных');
    process.exit(0);
  });