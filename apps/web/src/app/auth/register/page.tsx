"use client";

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Проверяем согласие с документами
    if (!formData.agreeToTerms) {
      setError('Необходимо согласиться с условиями использования и политикой конфиденциальности');
      setLoading(false);
      return;
    }

    try {
      // Регистрируем пользователя
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          agreeToTerms: formData.agreeToTerms
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка регистрации');

      // После успешной регистрации автоматически входим
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Ошибка автоматического входа');
      }

      // Проверяем, нужно ли заполнить профиль
      if (data.needsProfile) {
        router.push('/profile?welcome=true');
      } else {
        // Перенаправляем в личный кабинет в зависимости от роли
        // По умолчанию новые пользователи получают роль PLAYER
        router.push('/player');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="text-primary hover:opacity-85 mb-6 inline-block">
            ← Назад на главную
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Регистрация
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Создайте аккаунт для участия в сезоне
          </p>
        </div>

        <form method="post" className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full mt-1"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Пароль
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full mt-1"
                placeholder="Минимум 8 символов, буквы и цифры"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
          </div>

          <div className="space-y-4">
            <Checkbox
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              label={
                <>
                  Я соглашаюсь с{' '}
                  <Link href="/legal" className="text-primary hover:opacity-85" target="_blank">
                    условиями использования и политикой конфиденциальности
                  </Link>
                </>
              }
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full flex justify-center">
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link href="/auth/login" className="text-primary hover:opacity-85">
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

