import { cn } from "@/lib/utils";
import { APP_VERSION, RELEASES_URL } from "@/lib/version";

interface AppVersionProps {
  className?: string;
}

export const AppVersion = ({ className }: AppVersionProps) => {
  return (
    <a
      href={`${RELEASES_URL}/tag/v${APP_VERSION}`}
      target="_blank"
      rel="noreferrer"
      title="Voir les notes de version"
      className={cn(
        "text-xs text-muted-foreground tabular-nums transition-colors hover:text-foreground",
        className,
      )}
    >
      v{APP_VERSION}
    </a>
  );
};
