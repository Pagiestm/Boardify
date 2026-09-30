import { Logo } from "@/components/brand/logo";
import { UserButton } from "@/features/auth/components/user-button";

interface StandaloneLayoutProps {
  children: React.ReactNode;
}

const StandaloneLayout = ({ children }: StandaloneLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b bg-background">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <UserButton />
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
    </div>
  );
};

export default StandaloneLayout;
