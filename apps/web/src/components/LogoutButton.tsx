'use client';

import { signOut } from 'next-auth/react';

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const handleClick = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <button onClick={handleClick} className={className}>
      Выйти
    </button>
  );
}


