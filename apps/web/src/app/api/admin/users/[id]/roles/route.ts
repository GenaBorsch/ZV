import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UsersRepo, RolesRepo } from '@zv/db';
import { AdminManageUserRolesDto } from '@zv/contracts/admin';

function isAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MODERATOR') || r.includes('SUPERADMIN');
}

function isSuperAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('SUPERADMIN');
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    const userRoles = (session?.user as any)?.roles || [];
    
    if (!session?.user || !isAdmin(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Валидация данных
    const validationResult = AdminManageUserRolesDto.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { add = [], remove = [] } = validationResult.data;

    // Проверка существования пользователя
    const existingUser = await UsersRepo.getById(id);
    if (!existingUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверка прав на управление ролью SUPERADMIN
    const hasSuperAdminOperations = add.includes('SUPERADMIN') || remove.includes('SUPERADMIN');
    if (hasSuperAdminOperations && !isSuperAdmin(userRoles)) {
      return NextResponse.json({ 
        error: 'Только суперадминистратор может управлять ролью SUPERADMIN' 
      }, { status: 403 });
    }

    // Проверка, не удаляем ли роль SUPERADMIN у единственного суперадмина
    if (remove.includes('SUPERADMIN')) {
      const isOnlySuperAdmin = await RolesRepo.isOnlySuperAdmin(id);
      if (isOnlySuperAdmin) {
        return NextResponse.json({ 
          error: 'Нельзя удалить роль SUPERADMIN у единственного суперадминистратора' 
        }, { status: 409 });
      }
    }

    // Управление ролями в транзакции
    const updatedRoles = await RolesRepo.manageUserRoles(id, { add, remove });

    return NextResponse.json({ roles: updatedRoles });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]/roles:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}
