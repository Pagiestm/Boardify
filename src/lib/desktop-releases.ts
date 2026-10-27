import "server-only";

const RELEASES_URL = "https://api.github.com/repos/Pagiestm/Boardify/releases?per_page=10";

export type DesktopPlatform = "macos" | "windows" | "linux";

export interface DesktopDownload {
  platform: DesktopPlatform;
  label: string;
  url: string;
}

export interface DesktopRelease {
  version: string;
  url: string;
  downloads: DesktopDownload[];
}

const ASSETS: { platform: DesktopPlatform; label: string; pattern: RegExp }[] = [
  { platform: "macos", label: "Mac Apple Silicon (M1 et plus)", pattern: /_aarch64\.dmg$/ },
  { platform: "macos", label: "Mac Intel", pattern: /_x64\.dmg$/ },
  { platform: "windows", label: "Windows (installateur)", pattern: /_x64-setup\.exe$/ },
  { platform: "windows", label: "Windows (MSI)", pattern: /_x64_[\w-]+\.msi$/ },
  { platform: "linux", label: "Linux (AppImage)", pattern: /_amd64\.AppImage$/ },
  { platform: "linux", label: "Debian / Ubuntu (.deb)", pattern: /_amd64\.deb$/ },
  { platform: "linux", label: "Fedora (.rpm)", pattern: /\.x86_64\.rpm$/ },
];

export const getDesktopRelease = async (): Promise<DesktopRelease | null> => {
  try {
    const response = await fetch(RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const releases = (await response.json()) as {
      tag_name: string;
      html_url: string;
      draft: boolean;
      prerelease: boolean;
      assets: { name: string; browser_download_url: string }[];
    }[];

    for (const release of releases) {
      if (release.draft || release.prerelease) continue;

      const downloads = ASSETS.flatMap(({ platform, label, pattern }): DesktopDownload[] => {
        const asset = release.assets.find((candidate) => pattern.test(candidate.name));
        return asset ? [{ platform, label, url: asset.browser_download_url }] : [];
      });

      if (downloads.length > 0) {
        return { version: release.tag_name, url: release.html_url, downloads };
      }
    }
  } catch (error) {
    console.error("Lecture des releases GitHub impossible", error);
  }

  return null;
};

export const detectPlatform = (userAgent: string | null): DesktopPlatform | null => {
  if (!userAgent) return null;
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Linux|X11/i.test(userAgent) && !/Android/i.test(userAgent)) return "linux";
  return null;
};
