import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UsersRepo, RolesRepo } from '@zv/db';
import { AdminUpdateUserDto } from '@zv/contracts/admin';

function isAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MODERATOR') || r.includes('SUPERADMIN');
}

function isSuperAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('SUPERADMIN');
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;

    // Получение пользователя
    const user = await UsersRepo.getById(id);
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Получение ролей пользователя
    const roles = await RolesRepo.listByUser(id);

    const response = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tel: user.tel,
        tgId: user.tgId,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      roles,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Валидация данных
    const validationResult = AdminUpdateUserDto.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const updateData = validationResult.data;

    // Проверка существования пользователя
    const existingUser = await UsersRepo.getById(id);
    if (!existingUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверка уникальности email при изменении
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await UsersRepo.findByEmail(updateData.email);
      if (emailExists) {
        return NextResponse.json({ 
          error: 'Пользователь с таким email уже существует' 
        }, { status: 409 });
      }
    }

    // Обновление пользователя
    const updatedUser = await UsersRepo.update(id, updateData);
    if (!updatedUser) {
      return NextResponse.json({ error: 'Ошибка обновления пользователя' }, { status: 500 });
    }

    const response = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      tel: updatedUser.tel,
      tgId: updatedUser.tgId,
      avatarUrl: updatedUser.avatarUrl,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;

    // Проверка существования пользователя
    const existingUser = await UsersRepo.getById(id);
    if (!existingUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверка, не является ли пользователь единственным SUPERADMIN
    const isOnlySuperAdmin = await RolesRepo.isOnlySuperAdmin(id);
    if (isOnlySuperAdmin) {
      return NextResponse.json({ 
        error: 'Нельзя удалить единственного суперадминистратора' 
      }, { status: 409 });
    }

    // Удаление пользователя
    try {
      await UsersRepo.delete(id);
      return NextResponse.json({ message: 'Пользователь успешно удален' });
    } catch (error: any) {
      if (error.message.includes('связанные записи')) {
        return NextResponse.json({ 
          error: error.message 
        }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}
