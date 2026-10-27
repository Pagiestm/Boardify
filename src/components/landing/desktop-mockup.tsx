"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FaApple } from "react-icons/fa";
import {
  BatteryFullIcon,
  CalendarIcon,
  FolderIcon,
  MailIcon,
  SearchIcon,
  WifiIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

import { AppPreview } from "./app-preview";

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 800;

const MENU_ITEMS = ["Fichier", "Édition", "Affichage", "Fenêtre", "Aide"];

const DOCK_APPS = [
  { icon: FolderIcon, className: "bg-gradient-to-b from-sky-300 to-sky-500 text-white" },
  { icon: MailIcon, className: "bg-gradient-to-b from-blue-400 to-blue-600 text-white" },
  { icon: CalendarIcon, className: "bg-white text-rose-500" },
];

const Desktop = () => (
  <div className="relative size-full overflow-hidden bg-gradient-to-br from-emerald-200 via-sky-100 to-indigo-200 dark:from-emerald-950 dark:via-slate-900 dark:to-indigo-950">
    <div className="absolute -top-40 -left-24 size-[560px] rounded-full bg-emerald-300/50 blur-3xl dark:bg-emerald-700/30" />
    <div className="absolute -right-32 -bottom-48 size-[620px] rounded-full bg-indigo-300/50 blur-3xl dark:bg-indigo-700/30" />

    <div className="relative flex h-7 items-center justify-between bg-white/50 px-4 text-[13px] backdrop-blur-xl dark:bg-black/30">
      <div className="flex items-center gap-5">
        <FaApple className="size-3.5" />
        <span className="font-semibold">Boardify</span>
        {MENU_ITEMS.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <BatteryFullIcon className="size-4" />
        <WifiIcon className="size-3.5" />
        <SearchIcon className="size-3.5" />
        <span>mar. 27 oct. 9:41</span>
      </div>
    </div>

    <div className="absolute top-12 left-16 flex h-[650px] w-[1148px] flex-col overflow-hidden rounded-xl border border-black/10 bg-background shadow-2xl shadow-black/30 dark:border-white/10">
      <div className="flex h-9 items-center gap-2 border-b bg-muted/60 px-4">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="flex-1 text-center text-[13px] font-medium text-muted-foreground">
          Boardify
        </span>
        <span className="w-[52px]" />
      </div>
      <AppPreview className="min-h-0 flex-1 rounded-none border-0 shadow-none" />
    </div>

    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-2.5 rounded-[22px] border border-white/50 bg-white/40 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      {DOCK_APPS.map(({ icon: Icon, className }, index) => (
        <span
          key={index}
          className={cn("flex size-12 items-center justify-center rounded-xl shadow-sm", className)}
        >
          <Icon className="size-6" />
        </span>
      ))}
      <span className="relative flex flex-col items-center">
        <LogoMark className="size-12 drop-shadow-sm" />
        <span className="absolute -bottom-1.5 size-1 rounded-full bg-foreground/70" />
      </span>
    </div>
  </div>
);

interface DesktopMockupProps {
  className?: string;
}

export const DesktopMockup = ({ className }: DesktopMockupProps) => {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SCREEN_WIDTH);
    });
    observer.observe(screen);

    return () => observer.disconnect();
  }, []);

  return (
    <div aria-hidden className={cn("relative mx-auto w-full max-w-4xl select-none", className)}>
      <div className="absolute inset-x-[10%] top-[10%] bottom-0 -z-10 rounded-full bg-primary/25 blur-3xl dark:bg-primary/15" />

      <div className="relative rounded-[3%/4.6%] bg-zinc-900 p-[1.6%] pb-[2.2%] shadow-2xl ring-1 shadow-black/25 ring-zinc-950/80 dark:bg-zinc-950 dark:ring-zinc-700">
        <span className="absolute top-[0.7%] left-1/2 size-[0.6%] min-h-1 min-w-1 -translate-x-1/2 rounded-full bg-zinc-700" />
        <div
          ref={screenRef}
          className="relative aspect-[16/10] overflow-hidden rounded-[0.5%] bg-zinc-950"
        >
          <div
            className={cn("absolute top-0 left-0 origin-top-left", scale === null && "invisible")}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              transform: `scale(${scale ?? 1})`,
            }}
          >
            <Desktop />
          </div>
        </div>
      </div>

      <div className="relative -mx-[7%] rounded-b-[7%_100%] border-t border-white/60 bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-400 pb-[2.6%] shadow-[0_24px_40px_-16px_rgba(0,0,0,0.45)] dark:border-white/10 dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-800">
        <span className="absolute top-0 left-1/2 h-[45%] w-[13%] -translate-x-1/2 rounded-b-[40%_100%] bg-zinc-400/80 dark:bg-zinc-900/60" />
      </div>
    </div>
  );
};
