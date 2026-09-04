import Shell from '@/components/Shell';
import AuthGuard from '@/components/AuthGuard';

// Layout for all authenticated app pages: guards access, then renders the shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Shell>{children}</Shell>
    </AuthGuard>
  );
}
