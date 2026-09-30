import { Logo } from "@/components/brand/logo";
import { AppVersion } from "@/components/app-version";

import { AuthShowcase } from "./auth-showcase";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Logo href="/" />
        <div className="flex flex-1 items-center justify-center py-12">{children}</div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Boardify
          <span aria-hidden>·</span>
          <AppVersion />
        </p>
      </div>
      <AuthShowcase />
    </main>
  );
};

export default AuthLayout;
