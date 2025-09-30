import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UsersRepo } from '@zv/db';
import { AdminUsersListQueryDto } from '@zv/contracts/admin';

function isAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MODERATOR') || r.includes('SUPERADMIN');
}

export async function GET(req: Request) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Парсинг параметров запроса
    const url = new URL(req.url);
    const searchParams: any = Object.fromEntries(url.searchParams.entries());
    
    // Обработка массива ролей
    const rolesParam = url.searchParams.getAll('roles[]');
    if (rolesParam.length > 0) {
      searchParams.roles = rolesParam;
    }

    // Валидация параметров
    const validationResult = AdminUsersListQueryDto.safeParse(searchParams);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные параметры запроса',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const params = validationResult.data;

    // Получение данных
    const result = await UsersRepo.list({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      roles: params.roles as any,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    });

    // Форматирование ответа
    const response = {
      items: result.items.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        tel: user.tel,
        tgId: user.tgId,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      page: params.page,
      pageSize: params.pageSize,
      total: result.total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}
