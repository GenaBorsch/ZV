import { initializeBuckets } from './minio';

let isInitialized = false;

/**
 * Инициализация MinIO при запуске приложения
 * Вызывается один раз при старте сервера
 */
export async function initMinIO() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('🔧 Initializing MinIO buckets...');
    await initializeBuckets();
    console.log('✅ MinIO buckets initialized successfully');
    isInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize MinIO buckets:', error);
    // Не останавливаем приложение, если MinIO недоступен
    // В production это может быть временной проблемой
  }
}
