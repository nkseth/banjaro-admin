import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminDb } from '@/lib/firebase-admin';
import { verifyPassword, verifyPlain } from '@/lib/admin-password';

/**
 * Who may sign in to this console.
 *
 * Two routes, both deliberate:
 *
 * 1. The bootstrap admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, for getting in
 *    before any admin document exists. Absent those variables there is no
 *    fallback account at all — this console can ban and delete real people's
 *    accounts, so a built-in default credential would be a back door.
 * 2. Documents in the `admins` collection, holding a scrypt `passwordHash`
 *    (see scripts/make-admin-hash.mjs). A legacy plaintext `password` field is
 *    refused rather than honoured.
 */
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Banjaro Admin',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        if (bootstrapEmail && email === bootstrapEmail) {
          return verifyPlain(password, process.env.ADMIN_PASSWORD)
            ? { id: 'bootstrap-admin', email, name: 'Admin', role: 'admin' }
            : null;
        }

        try {
          const snapshot = await adminDb
            .collection('admins')
            .where('email', '==', email)
            .limit(1)
            .get();

          if (snapshot.empty) return null;

          const doc = snapshot.docs[0];
          const data = doc.data();

          if (!data.passwordHash) {
            console.error(
              `admins/${doc.id} has no passwordHash. Generate one with ` +
                '`node scripts/make-admin-hash.mjs <password>`; plaintext passwords are not accepted.'
            );
            return null;
          }

          if (!verifyPassword(password, data.passwordHash)) return null;

          return {
            id: doc.id,
            email: data.email,
            name: data.name ?? 'Admin',
            role: data.role ?? 'admin'
          };
        } catch (error) {
          console.error('Admin sign-in failed', error);
          return null;
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string;
      return session;
    }
  },
  pages: { signIn: '/login' }
});

export { handler as GET, handler as POST };
