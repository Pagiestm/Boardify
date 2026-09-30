import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

/** Rounded square with three columns of decreasing height — a board. */
export const LogoMark = ({ className }: LogoMarkProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <rect x="6" y="6" width="3" height="12" rx="1.5" className="fill-primary-foreground" />
      <rect x="10.5" y="6" width="3" height="8" rx="1.5" className="fill-primary-foreground" />
      <rect x="15" y="6" width="3" height="5" rx="1.5" className="fill-primary-foreground" />
    </svg>
  );
};

interface LogoProps {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export const Logo = ({ href = "/", className, markClassName, textClassName }: LogoProps) => {
  return (
    <Link
      href={href}
      aria-label="Boardify — accueil"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <LogoMark className={markClassName} />
      <span className={cn("text-[15px] font-semibold tracking-tight", textClassName)}>
        Boardify
      </span>
    </Link>
  );
};
