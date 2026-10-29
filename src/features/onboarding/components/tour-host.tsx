"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { useCurrent } from "@/features/auth/api/use-current";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { Tour, TOURS, findTour } from "../tours";
import { hasSeenTour, markTourSeen, startTour, stopTour, useActiveTour } from "../store";

const MARGIN = 12;
const EDGE = 12;
const PADDING = 6;

/** Premier élément visible portant `data-tour="name"`. */
const findTarget = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-tour~="${name}"]`)).find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

type Box = { top: number; left: number; width: number; height: number };

const sameBox = (a: Box | null, b: Box | null) =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5);

/** Place la bulle sous, au-dessus ou à côté de l'élément, sans sortir de l'écran. */
const placeCard = (target: Box | null, card: { width: number; height: number }) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), width - card.width - EDGE);
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), height - card.height - EDGE);

  if (!target) {
    return { top: (height - card.height) / 2, left: (width - card.width) / 2 };
  }
  const centerX = clampX(target.left + target.width / 2 - card.width / 2);
  const bottom = target.top + target.height;
  const right = target.left + target.width;

  if (bottom + MARGIN + card.height <= height - EDGE)
    return { top: bottom + MARGIN, left: centerX };
  if (target.top - MARGIN - card.height >= EDGE) {
    return { top: target.top - MARGIN - card.height, left: centerX };
  }
  if (right + MARGIN + card.width <= width - EDGE) {
    return { top: clampY(target.top), left: right + MARGIN };
  }
  if (target.left - MARGIN - card.width >= EDGE) {
    return { top: clampY(target.top), left: target.left - MARGIN - card.width };
  }
  return { top: height - card.height - EDGE, left: (width - card.width) / 2 };
};

interface TourOverlayProps {
  tour: Tour;
  onClose: () => void;
}

const TourOverlay = ({ tour, onClose }: TourOverlayProps) => {
  // Seules les étapes dont l'élément est présent sur la page sont proposées.
  const [steps] = useState(() =>
    tour.steps.filter((step) => !step.target || findTarget(step.target)),
  );
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardSize, setCardSize] = useState({ width: 340, height: 180 });
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = useCallback(
    () => (isLast ? onClose() : setIndex((value) => value + 1)),
    [isLast, onClose],
  );
  const previous = useCallback(() => setIndex((value) => Math.max(0, value - 1)), []);

  // Amène l'élément à l'écran, puis suit sa position (défilement, redimensionnement).
  useEffect(() => {
    if (!step) return;
    const element = step.target ? findTarget(step.target) : undefined;
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top < 64 || rect.bottom > window.innerHeight - 16) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    let frame = 0;
    const track = () => {
      const current = step.target ? findTarget(step.target) : undefined;
      const rect = current?.getBoundingClientRect();
      const next = rect
        ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        : null;
      setBox((previous) => (sameBox(previous, next) ? previous : next));
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    nextRef.current?.focus();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  // Taille réelle de la bulle, pour la placer sans qu'elle sorte de l'écran.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new ResizeObserver(() =>
      setCardSize({ width: card.offsetWidth, height: card.offsetHeight }),
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") previous();
      else return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [next, previous, onClose]);

  useEffect(() => {
    if (steps.length === 0) onClose();
  }, [steps.length, onClose]);

  if (!step) return null;

  // Le halo reste dans l'écran, même pour un élément plus grand que lui.
  const spot = box && {
    top: Math.max(box.top - PADDING, 4),
    left: Math.max(box.left - PADDING, 4),
    bottom: Math.min(box.top + box.height + PADDING, window.innerHeight - 4),
    right: Math.min(box.left + box.width + PADDING, window.innerWidth - 4),
  };
  const position = placeCard(
    spot
      ? {
          top: spot.top,
          left: spot.left,
          width: spot.right - spot.left,
          height: spot.bottom - spot.top,
        }
      : null,
    cardSize,
  );

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Bloque la page pendant la visite. */}
      <div aria-hidden className="absolute inset-0" />
      {/* Voile autour de l'élément : l'ombre suit l'arrondi du cadre. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute transition-all duration-300 ease-out",
          spot && "rounded-lg border-2 border-primary",
        )}
        style={{
          ...(spot
            ? {
                top: spot.top,
                left: spot.left,
                width: spot.right - spot.left,
                height: spot.bottom - spot.top,
              }
            : { top: "50%", left: "50%", width: 0, height: 0 }),
          boxShadow: "0 0 0 200vmax rgb(0 0 0 / 0.5)",
        }}
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="absolute flex w-[min(340px,calc(100vw-24px))] flex-col gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-2xl transition-[top,left] duration-300 ease-out"
        style={position}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-primary">Visite guidée · {tour.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {index + 1} / {steps.length}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h2 id="tour-title" className="text-base font-semibold">
            {step.title}
          </h2>
          <p id="tour-body" className="text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </div>
        <div className="flex gap-1" aria-hidden>
          {steps.map((item, position) => (
            <span
              key={item.title}
              className={cn(
                "h-1 flex-1 rounded-full",
                position <= index ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="-ml-2">
            Passer
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={previous}>
                Précédent
              </Button>
            )}
            <Button ref={nextRef} size="sm" onClick={next}>
              {isLast ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * Lance la visite de la page la première fois qu'on y arrive, et affiche celle demandée
 * depuis le menu du compte.
 */
export const TourHost = () => {
  const pathname = usePathname();
  const { data: user } = useCurrent();
  const activeId = useActiveTour();
  const tour = TOURS.find((candidate) => candidate.id === activeId);
  const userId = user?.$id;

  useEffect(() => {
    if (!userId) return;
    const candidate = findTour(pathname);
    if (!candidate || hasSeenTour(userId, candidate.id)) return;

    // Attend que la page soit chargée et qu'aucune fenêtre ne soit ouverte.
    let attempts = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      attempts++;
      const ready = findTarget(candidate.waitFor) && !document.querySelector("[role=dialog]");
      if (ready || attempts > 80) clearInterval(interval);
      if (ready) timeout = setTimeout(() => startTour(candidate.id), 600);
    }, 250);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname, userId]);

  // Une visite s'arrête quand on quitte sa page.
  useEffect(() => {
    if (tour && !tour.match(pathname)) stopTour();
  }, [tour, pathname]);

  const close = useCallback(() => {
    if (userId && tour) markTourSeen(userId, tour.id);
    stopTour();
  }, [userId, tour]);

  if (!tour || !userId || !tour.match(pathname)) return null;

  return <TourOverlay key={`${tour.id}:${pathname}`} tour={tour} onClose={close} />;
};
