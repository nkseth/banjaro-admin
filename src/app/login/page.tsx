import { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Sign in | Banjaro Admin',
  description: 'Sign in to the Banjaro moderation console'
};

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Banjaro Admin</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Moderation and operations console.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
