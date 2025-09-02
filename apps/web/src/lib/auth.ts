import CredentialsProvider from 'next-auth/providers/credentials';
import { db, users, userRoles, eq } from '@zv/db';
import bcrypt from 'bcryptjs';

export const authOptions = {
  session: { strategy: 'jwt' as const },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userResult = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        if (userResult.length === 0 || !userResult[0].passwordHash) return null;

        const user = userResult[0];
        const ok = bcrypt.compareSync(credentials.password, user.passwordHash!);
        if (!ok) return null;

        const roles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          roles: roles.map((r) => r.role),
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.roles = (user as any).roles || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).roles = (token as any).roles || [];
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
} as const;


