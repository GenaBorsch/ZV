"use client";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Функция для преобразования MinIO URL в API URL
function convertMinioUrlToApiUrl(url: string): string {
  // Если это уже API URL, возвращаем как есть
  if (url.startsWith('/api/files/')) {
    return url;
  }
  
  // Если это прямой MinIO URL, преобразуем его
  const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT || 'http://localhost:9000';
  if (url.startsWith(s3Endpoint)) {
    // Убираем endpoint из URL и добавляем префикс API
    const pathPart = url.substring(s3Endpoint.length);
    return `/api/files${pathPart}`;
  }
  
  // Если это относительный путь, добавляем префикс API
  if (url.startsWith('/')) {
    return `/api/files${url}`;
  }
  
  // Возвращаем URL как есть для других случаев
  return url;
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const apiSrc = convertMinioUrlToApiUrl(src);
  
  return (
    <img 
      src={apiSrc} 
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
