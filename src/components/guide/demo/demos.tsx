"use client";

import { DemoPlayer } from "./demo-player";
import { DemoScene } from "./timeline";
import { createTaskScene } from "./scenes/create-task";
import { moveCardScene } from "./scenes/move-card";
import { savedViewScene } from "./scenes/saved-view";
import { commandPaletteScene } from "./scenes/command-palette";
import { inviteMemberScene } from "./scenes/invite-member";
import { sprintScene } from "./scenes/sprint";
import { focusDayScene } from "./scenes/focus-day";
import { aiCompleteScene } from "./scenes/ai-complete";
import { aiFromTextScene } from "./scenes/ai-from-text";
import { quickAddScene } from "./scenes/quick-add";
import { githubSyncScene } from "./scenes/github-sync";

const SCENES = {
  "create-task": createTaskScene,
  "move-card": moveCardScene,
  "saved-view": savedViewScene,
  "command-palette": commandPaletteScene,
  "invite-member": inviteMemberScene,
  sprint: sprintScene,
  "focus-day": focusDayScene,
  "ai-complete": aiCompleteScene,
  "ai-from-text": aiFromTextScene,
  "quick-add": quickAddScene,
  "github-sync": githubSyncScene,
} satisfies Record<string, DemoScene>;

export type DemoId = keyof typeof SCENES;

/** Démo animée du guide, utilisable depuis un composant serveur. */
export const Demo = ({ id, className }: { id: DemoId; className?: string }) => (
  <DemoPlayer scene={SCENES[id]} className={className} />
);
