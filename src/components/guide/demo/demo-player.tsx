"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MaximizeIcon, MinimizeIcon, PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

import {
  DemoScene,
  DemoTarget,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  clamp,
  easeInOut,
  lerp,
  progress,
} from "./timeline";

const CURSOR_DURATION = 600;
const CAMERA_DURATION = 900;
const CLICK_DURATION = 450;
const KEYSTROKE_DURATION = 1100;

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

type Point = { x: number; y: number };

/** Interpole une suite de déplacements jusqu'à l'instant `t`. */
const follow = <K extends DemoTarget & { at: number; duration?: number }>(
  keys: K[],
  t: number,
  resolve: (key: K) => Point,
  fallbackDuration: number,
  extra?: (key: K) => number,
) => {
  let point = keys[0] ? resolve(keys[0]) : { x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 };
  let value = keys[0] && extra ? extra(keys[0]) : 1;
  for (const key of keys.slice(1)) {
    if (key.at > t) break;
    const amount = easeInOut(progress(t, key.at, key.at + (key.duration ?? fallbackDuration)));
    const target = resolve(key);
    point = { x: lerp(point.x, target.x, amount), y: lerp(point.y, target.y, amount) };
    if (extra) value = lerp(value, extra(key), amount);
  }
  return { point, value };
};

const CursorArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-md">
    <path
      d="M5 3l14 8.5-6.2 1.3L9.9 19 5 3z"
      fill="white"
      stroke="black"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

interface DemoPlayerProps {
  scene: DemoScene;
  className?: string;
}

/** Lecteur des démos animées : lecture, pause, déplacement dans la timeline, plein écran. */
export const DemoPlayer = ({ scene, className }: DemoPlayerProps) => {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scale, setScale] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const tRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const positions = useRef(new Map<string, Point>());
  const autoplayed = useRef(false);

  const seek = useCallback(
    (value: number) => {
      tRef.current = clamp(value, 0, scene.duration);
      setT(tRef.current);
    },
    [scene.duration],
  );

  const toggle = useCallback(() => {
    autoplayed.current = true;
    if (playing) return setPlaying(false);
    if (tRef.current >= scene.duration) seek(0);
    setPlaying(true);
  }, [playing, scene.duration, seek]);

  // Avance la timeline image par image.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const next = Math.min(scene.duration, tRef.current + (now - last));
      last = now;
      tRef.current = next;
      setT(next);
      if (next >= scene.duration) return setPlaying(false);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, scene.duration]);

  // Met la scène à l'échelle de la largeur disponible.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / STAGE_WIDTH),
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Lecture automatique quand la démo est visible, pause quand elle ne l'est plus.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return setPlaying(false);
        if (entry.intersectionRatio >= 0.6 && !autoplayed.current && !reduceMotion) {
          autoplayed.current = true;
          setPlaying(true);
        }
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Place la caméra et le curseur : les cibles sont mesurées dans la scène affichée.
  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (!camera || !scale) return;

    const layer = camera.getBoundingClientRect();
    const ratio = scale * zoomRef.current;
    camera.querySelectorAll<HTMLElement>("[data-demo]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      positions.current.set(element.dataset.demo!, {
        x: (rect.left + rect.width / 2 - layer.left) / ratio,
        y: (rect.top + rect.height / 2 - layer.top) / ratio,
      });
    });
    const resolve = (key: DemoTarget): Point => {
      if ("target" in key) {
        const point = positions.current.get(key.target) ?? {
          x: STAGE_WIDTH / 2,
          y: STAGE_HEIGHT / 2,
        };
        return { x: point.x + (key.dx ?? 0), y: point.y + (key.dy ?? 0) };
      }
      return key;
    };

    const view = follow(scene.camera, t, resolve, CAMERA_DURATION, (key) => key.zoom);
    const zoom = Math.max(1, view.value);
    const x = clamp(STAGE_WIDTH / 2 - view.point.x * zoom, STAGE_WIDTH - STAGE_WIDTH * zoom, 0);
    const y = clamp(STAGE_HEIGHT / 2 - view.point.y * zoom, STAGE_HEIGHT - STAGE_HEIGHT * zoom, 0);
    camera.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    zoomRef.current = zoom;

    const pointer = follow(scene.cursor, t, resolve, CURSOR_DURATION).point;
    const left = pointer.x * zoom + x;
    const top = pointer.y * zoom + y;
    const click = (scene.clicks ?? []).findLast((at) => at <= t && t < at + CLICK_DURATION);
    const clickProgress = click === undefined ? 1 : progress(t, click, click + CLICK_DURATION);

    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${left - 4}px, ${top - 3}px) scale(${
        click === undefined ? 1 : 0.85 + 0.15 * clickProgress
      })`;
      cursorRef.current.style.opacity = scene.cursor.length ? "1" : "0";
    }
    if (rippleRef.current) {
      rippleRef.current.style.transform = `translate(${left - 18}px, ${top - 18}px) scale(${
        0.4 + clickProgress
      })`;
      rippleRef.current.style.opacity = click === undefined ? "0" : String(1 - clickProgress);
    }
  }, [scene, t, scale]);

  const stepIndex = scene.steps.findLastIndex((step) => step.at <= t);
  const step = scene.steps[Math.max(0, stepIndex)];
  const keystroke = scene.keystrokes?.findLast(
    (item) => item.at <= t && t < item.at + (item.duration ?? KEYSTROKE_DURATION),
  );
  const ended = t >= scene.duration;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={`Démo : ${scene.title}`}
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        fullscreen && "flex flex-col justify-center rounded-none border-0 bg-background",
        className,
      )}
    >
      <div
        ref={frameRef}
        className={cn(
          "relative w-full overflow-hidden bg-muted/40",
          fullscreen && "mx-auto w-[min(100%,calc((100vh-7rem)*1.6))]",
        )}
        style={{ aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `scale(${scale})`,
            visibility: scale ? "visible" : "hidden",
          }}
        >
          <div ref={cameraRef} className="absolute inset-0 origin-top-left">
            {scene.render(t)}
          </div>
          <div
            ref={rippleRef}
            className="absolute top-0 left-0 size-9 rounded-full border-2 border-primary bg-primary/20 opacity-0"
          />
          <div ref={cursorRef} className="absolute top-0 left-0 opacity-0">
            <CursorArrow />
          </div>
          {keystroke && (
            <div className="absolute top-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border bg-background/95 px-3 py-2 shadow-lg">
              {keystroke.keys.split(" ").map((key) => (
                <Kbd key={key} className="h-7 min-w-7 px-2 text-sm text-foreground">
                  {key}
                </Kbd>
              ))}
            </div>
          )}
          {step && t > 0 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center px-6">
              <p className="rounded-lg bg-black/75 px-3.5 py-1.5 text-center text-[15px] font-medium text-white shadow-lg">
                {step.label}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Mettre en pause" : ended ? "Revoir la démo" : "Lire la démo"}
          className="group absolute inset-0 flex items-center justify-center outline-none"
        >
          {!playing && t > 0 && !ended && (
            <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white">
              <PauseIcon className="size-4 fill-current" />
            </span>
          )}
          {!playing && (t === 0 || ended) && (
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-ring/40">
              {ended ? (
                <RotateCcwIcon className="size-6" />
              ) : (
                <PlayIcon className="ml-0.5 size-6 fill-current" />
              )}
            </span>
          )}
        </button>
      </div>

      <div
        className={cn("flex flex-col gap-3 border-t p-3", fullscreen && "mx-auto w-full max-w-5xl")}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Mettre en pause" : "Lire"}
            className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          >
            {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={scene.duration}
            step={50}
            value={t}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Position dans la démo"
            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
          />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatTime(t)} / {formatTime(scene.duration)}
          </span>
          <button
            type="button"
            onClick={() =>
              fullscreen ? document.exitFullscreen() : rootRef.current?.requestFullscreen()
            }
            aria-label={fullscreen ? "Quitter le plein écran" : "Plein écran"}
            className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          >
            {fullscreen ? <MinimizeIcon className="size-4" /> : <MaximizeIcon className="size-4" />}
          </button>
        </div>
        <ol className="flex flex-wrap gap-1.5">
          {scene.steps.map((item, index) => (
            <li key={item.at}>
              <button
                type="button"
                onClick={() => {
                  seek(item.at);
                  autoplayed.current = true;
                  setPlaying(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  index === stepIndex
                    ? "border-primary bg-primary/10 text-primary"
                    : index < stepIndex
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="font-semibold">{index + 1}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
