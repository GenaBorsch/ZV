import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { minioClient, BUCKETS } from '@/lib/minio';

export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации и прав
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userRoles = (session.user as any)?.roles as string[] || [];
    if (!userRoles.includes('SUPERADMIN')) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    if (!minioClient) {
      return NextResponse.json(
        { error: 'MinIO client недоступен' },
        { status: 500 }
      );
    }

    // Устанавливаем политику для bucket uploads
    const bucket = BUCKETS.UPLOADS;
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    console.log(`✅ Set public read policy for bucket: ${bucket}`);

    return NextResponse.json({
      success: true,
      message: `Политика установлена для bucket: ${bucket}`,
    });

  } catch (error: any) {
    console.error('❌ Error setting MinIO policy:', error);
    return NextResponse.json(
      { error: 'Ошибка установки политики MinIO: ' + error.message },
      { status: 500 }
    );
  }
}
