"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { GUIDE_CHAPTERS } from "./chapters";

/** Sommaire du guide : met en avant le chapitre en cours de lecture. */
export const GuideToc = () => {
  const [active, setActive] = useState(GUIDE_CHAPTERS[0].id);
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = GUIDE_CHAPTERS.map((chapter) => document.getElementById(chapter.id)).filter(
      (section): section is HTMLElement => section !== null,
    );
    // Le chapitre en cours est le dernier dont le titre est passé sous l'en-tête ;
    // tout en bas de la page, c'est le dernier chapitre.
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
        const current = atBottom
          ? sections.at(-1)
          : sections.filter((section) => section.getBoundingClientRect().top <= 160).at(-1);
        setActive(current?.id ?? GUIDE_CHAPTERS[0].id);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Garde la pastille du chapitre en cours visible dans la bande mobile.
  useEffect(() => {
    const strip = chipsRef.current;
    const chip = strip?.querySelector<HTMLElement>(`[data-chapter="${active}"]`);
    if (!strip || !chip || strip.offsetParent === null) return;
    strip.scrollTo({ left: chip.offsetLeft - (strip.clientWidth - chip.clientWidth) / 2 });
  }, [active]);

  return (
    <>
      {/* Mobile : chapitres défilants sous l'en-tête. */}
      <nav
        aria-label="Chapitres du guide"
        className="sticky top-14 z-30 -mx-4 border-b bg-background/95 backdrop-blur sm:-mx-6 lg:hidden"
      >
        <div
          ref={chipsRef}
          className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6"
        >
          {GUIDE_CHAPTERS.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              data-chapter={chapter.id}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active === chapter.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {chapter.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Ordinateur : sommaire fixe à gauche. */}
      <nav aria-label="Sommaire du guide" className="sticky top-24 hidden self-start lg:block">
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Sommaire
        </p>
        <ol className="flex flex-col gap-0.5 border-l">
          {GUIDE_CHAPTERS.map(({ id, title, icon: Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                className={cn(
                  "-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 text-sm transition-colors",
                  active === id
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};
