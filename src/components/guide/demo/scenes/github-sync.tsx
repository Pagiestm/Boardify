import { FaGithub } from "react-icons/fa";
import {
  CircleCheckIcon,
  CircleDotIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitMergeIcon,
  GitPullRequestIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { MiniAvatar } from "@/components/landing/preview-data";

import {
  AppFrame,
  MockButton,
  MockDialog,
  MockField,
  MockMenu,
  MockSelect,
  MockToast,
  highlight,
} from "../mock";
import { DemoScene, STAGE_HEIGHT, STAGE_WIDTH, between, fadeIn, progress } from "../timeline";

const REPOSITORY = "studio-nova/app-mobile";

const CONNECT_CLICK = 1600;
const INSTALL = CONNECT_CLICK + 100;
const INSTALL_CLICK = INSTALL + 1400;
const CONNECTED = INSTALL_CLICK + 100;
const PROJECT = CONNECTED + 2200;
const REPO_CLICK = PROJECT + 1000;
const REPO_PICK = REPO_CLICK + 900;
const SAVE = REPO_PICK + 400;
const SAVE_CLICK = SAVE + 700;
const SAVED = SAVE_CLICK + 100;
const SYNC = SAVED + 2500;
const MERGE_CLICK = SYNC + 1200;
const MERGED = MERGE_CLICK + 100;
const DONE = MERGED + 1500;
const TRANSITION = 300;

/** Opacité d'une phase visible pendant [start, end[ avec un fondu enchaîné. */
const phase = (t: number, start: number, end = Infinity) =>
  t < start || t >= end + TRANSITION
    ? 0
    : t < end
      ? start === 0
        ? 1
        : fadeIn(t, start, TRANSITION)
      : 1 - progress(t, end, end + TRANSITION);

const Card = ({
  children,
  demo,
  className,
  style,
}: {
  children: React.ReactNode;
  demo?: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    data-demo={demo}
    className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4", className)}
    style={style}
  >
    {children}
  </div>
);

/** Paramètres de l'espace : la carte GitHub avant et après la connexion. */
const WorkspaceSettings = ({ t }: { t: number }) => {
  const connected = t >= CONNECTED;
  const install = between(t, INSTALL, CONNECTED + 250)
    ? t < CONNECTED
      ? fadeIn(t, INSTALL)
      : 1 - progress(t, CONNECTED, CONNECTED + 250)
    : 0;

  return (
    <AppFrame
      title="Paramètres"
      active="Paramètres"
      overlay={
        <MockDialog
          demo="gh-install-dialog"
          title="Installer Boardify"
          description="Sur le compte studio-nova"
          visible={install}
          width={400}
          footer={
            <MockButton
              demo="gh-install"
              hover={between(t, INSTALL + 1100, CONNECTED)}
              className="bg-green-600 text-white dark:bg-green-600"
            >
              <FaGithub />
              Install
            </MockButton>
          }
        >
          <div className="flex flex-col gap-2 text-xs">
            <span className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
              <span className="size-3 rounded-full border-4 border-primary" />
              Tous les dépôts
            </span>
            <span className="flex items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground">
              <span className="size-3 rounded-full border" />
              Uniquement certains dépôts
            </span>
          </div>
        </MockDialog>
      }
    >
      <div className="flex flex-col gap-3">
        <Card>
          <span className="text-sm font-semibold">Paramètres de l&apos;espace</span>
          <MockField label="Nom de l'espace de travail" value="Équipe produit" />
        </Card>
        <Card demo="gh-card" style={highlight(progress(t, CONNECTED, CONNECTED + 1600))}>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FaGithub className="size-4" />
              GitHub
              {connected && <Badge variant="soft">Connecté</Badge>}
            </span>
            <span className="text-xs text-muted-foreground">
              Liez un dépôt à chaque projet : ses nouvelles tâches créent une issue, fermée quand la
              tâche est terminée.
            </span>
          </div>
          {connected ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs">
                Installé sur <span className="font-medium">studio-nova</span> · 3 dépôts accessibles
              </span>
              <span className="flex gap-2">
                <MockButton variant="outline" size="sm">
                  <ExternalLinkIcon />
                  Gérer les dépôts
                </MockButton>
                <MockButton variant="ghost" size="sm" className="text-destructive">
                  Déconnecter
                </MockButton>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Aucun compte GitHub connecté.</span>
              <MockButton demo="gh-connect" size="sm" hover={between(t, 1300, INSTALL)}>
                <FaGithub />
                Connecter GitHub
              </MockButton>
            </div>
          )}
        </Card>
        <Card>
          <span className="text-sm font-semibold">Assistant IA</span>
          <span className="text-xs text-muted-foreground">
            Branchez l&apos;IA de votre choix pour les membres de l&apos;espace.
          </span>
        </Card>
      </div>
    </AppFrame>
  );
};

/** Paramètres du projet : choix du dépôt lié. */
const ProjectSettings = ({ t }: { t: number }) => {
  const menuOpen = between(t, REPO_CLICK, REPO_PICK);
  const picked = t >= REPO_PICK;

  return (
    <AppFrame
      title="App mobile"
      active="App mobile"
      overlay={
        <MockToast visible={between(t, SAVED, SAVED + 2200) ? fadeIn(t, SAVED) : 0}>
          Projet mis à jour
        </MockToast>
      }
    >
      <Card demo="proj-card">
        <span className="text-sm font-semibold">Paramètres du projet</span>
        <MockField label="Nom du projet" value="App mobile" />
        <div className="relative">
          <MockSelect
            demo="gh-repo"
            label="Dépôt GitHub"
            open={menuOpen}
            value={
              picked ? (
                <>
                  <FaGithub />
                  {REPOSITORY}
                </>
              ) : (
                <span className="text-muted-foreground">Aucun dépôt</span>
              )
            }
          />
          {menuOpen && (
            <MockMenu
              className="absolute top-full right-0 left-0 mt-1"
              highlighted={t >= REPO_CLICK + 500 ? "repo-app-mobile" : undefined}
              items={[
                { id: "repo-none", label: "Aucun dépôt" },
                {
                  id: "repo-app-mobile",
                  label: (
                    <>
                      <FaGithub />
                      {REPOSITORY}
                    </>
                  ),
                },
                {
                  id: "repo-site",
                  label: (
                    <>
                      <FaGithub />
                      studio-nova/site-vitrine
                    </>
                  ),
                },
                {
                  id: "repo-design",
                  label: (
                    <>
                      <FaGithub />
                      studio-nova/design-system
                    </>
                  ),
                },
              ]}
            />
          )}
          <span className="mt-1.5 block text-[11px] text-muted-foreground">
            Chaque nouvelle tâche crée une issue dans ce dépôt, fermée quand la tâche est terminée.
          </span>
        </div>
        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {t >= SAVED && (
            <span className="rounded-md" style={highlight(progress(t, SAVED, SAVED + 1600))}>
              <MockButton variant="outline" demo="gh-import">
                <DownloadIcon />
                Importer les issues
              </MockButton>
            </span>
          )}
          <MockButton demo="gh-save" hover={between(t, SAVE + 500, SAVED)}>
            Enregistrer
          </MockButton>
        </div>
      </Card>
    </AppFrame>
  );
};

/** Boardify et GitHub côte à côte : la pull request mergée termine la tâche. */
const SyncView = ({ t }: { t: number }) => {
  const merged = t >= MERGED;
  const done = t >= DONE + 300;
  const doneFlash = highlight(progress(t, DONE + 300, DONE + 2000));

  return (
    <div
      className="relative flex gap-4 overflow-hidden bg-muted/50 p-5"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {/* Boardify */}
      <div className="flex w-[410px] flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
        <div className="flex h-9 items-center gap-2 border-b px-3 text-xs font-medium">
          <LogoMark className="size-4" />
          Boardify
          <span className="text-muted-foreground">· App mobile</span>
        </div>
        <div data-demo="task-sync" className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-base font-semibold">Intégration du paiement</span>
            <span className="rounded-md" style={doneFlash}>
              {done ? (
                <Badge variant={TaskStatus.DONE} dot>
                  Terminé
                </Badge>
              ) : (
                <Badge variant={TaskStatus.IN_PROGRESS} dot>
                  En cours
                </Badge>
              )}
            </span>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-y-2 text-xs">
            <span className="text-muted-foreground">Assigné à</span>
            <span className="flex items-center gap-1.5">
              <MiniAvatar name="Sam" />
              Sam
            </span>
            <span className="text-muted-foreground">Priorité</span>
            <Badge variant={TaskPriority.HIGH}>Haute</Badge>
            <span className="text-muted-foreground">GitHub</span>
            <span className="flex items-center gap-1.5">
              <FaGithub className="size-3.5" />
              Issue #42
            </span>
          </div>
          <div className="flex flex-col rounded-lg border">
            <span className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
              <FaGithub className="size-3.5" />
              Développement
            </span>
            <div className="flex flex-col gap-2.5 px-3 py-3 text-xs">
              <span className="flex items-center gap-2">
                <GitBranchIcon className="size-3.5 text-muted-foreground" />
                <span className="font-mono text-[11px]">42-integration-du-paiement</span>
              </span>
              <span className="flex items-center gap-2">
                <GitPullRequestIcon className="size-3.5 text-muted-foreground" />
                #57 Fixes #42
                <span className="ml-auto rounded-md" style={doneFlash}>
                  {done ? (
                    <Badge variant="soft">Mergée</Badge>
                  ) : (
                    <Badge variant="outline">En review</Badge>
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
        <div className="flex h-9 items-center gap-2 border-b bg-muted/60 px-3 text-[11px] text-muted-foreground">
          <FaGithub className="size-3.5 text-foreground" />
          github.com/{REPOSITORY}/issues/42
        </div>
        <div className="flex flex-col gap-3 p-4 text-xs">
          <span className="text-base font-semibold">
            Intégration du paiement <span className="font-normal text-muted-foreground">#42</span>
          </span>
          <span className="flex items-center gap-2">
            <span
              data-demo="gh-issue-state"
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-white",
                merged ? "bg-purple-600" : "bg-green-600",
              )}
            >
              {merged ? (
                <CircleCheckIcon className="size-3.5" />
              ) : (
                <CircleDotIcon className="size-3.5" />
              )}
              {merged ? "Closed" : "Open"}
            </span>
            <span className="text-muted-foreground">boardify-bot opened this issue</span>
          </span>
          <span className="flex gap-1.5">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              évolution
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700 dark:bg-red-500/15 dark:text-red-300">
              priorité : haute
            </span>
          </span>
          <div
            data-demo="gh-pr"
            className="flex flex-col gap-2.5 rounded-lg border p-3"
            style={highlight(progress(t, MERGED, MERGED + 1400))}
          >
            <span className="flex items-center gap-2 font-medium">
              {merged ? (
                <GitMergeIcon className="size-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <GitPullRequestIcon className="size-4 text-green-600 dark:text-green-400" />
              )}
              #57 Fixes #42
            </span>
            <span className="text-muted-foreground">
              sam veut fusionner 3 commits dans main depuis 42-integration-du-paiement
            </span>
            <MockButton
              demo="gh-merge"
              size="sm"
              hover={between(t, MERGE_CLICK - 500, MERGED)}
              className={cn(
                "w-fit text-white",
                merged ? "bg-purple-600 dark:bg-purple-600" : "bg-green-600 dark:bg-green-600",
              )}
            >
              <GitMergeIcon />
              {merged ? "Merged" : "Merge pull request"}
            </MockButton>
          </div>
          {merged && (
            <span
              className="flex items-center gap-2 text-muted-foreground"
              style={{ opacity: fadeIn(t, MERGED + 300) }}
            >
              <CircleCheckIcon className="size-3.5 text-purple-600 dark:text-purple-400" />
              Closed as completed via #57
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const githubSyncScene: DemoScene = {
  id: "github-sync",
  title: "Connecter GitHub",
  duration: DONE + 4300,
  steps: [
    { at: 0, label: "Dans Paramètres, cliquez sur Connecter GitHub" },
    { at: INSTALL, label: "Installez Boardify sur votre compte GitHub" },
    { at: PROJECT, label: "Choisissez le Dépôt GitHub du projet" },
    { at: SYNC, label: "Mergez la pull request « Fixes #42 »" },
    { at: DONE, label: "La tâche passe à Terminé dans Boardify" },
  ],
  clicks: [CONNECT_CLICK, INSTALL_CLICK, REPO_CLICK, REPO_PICK, SAVE_CLICK, MERGE_CLICK],
  cursor: [
    { at: 0, x: 600, y: 420 },
    { at: 900, target: "gh-connect" },
    { at: INSTALL + 700, target: "gh-install" },
    { at: PROJECT + 300, target: "gh-repo" },
    { at: REPO_CLICK + 250, target: "repo-app-mobile" },
    { at: SAVE, target: "gh-save" },
    { at: SYNC + 400, target: "gh-merge" },
    { at: MERGED + 400, x: 640, y: 470 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: 400, target: "gh-card", zoom: 1.5 },
    { at: INSTALL + 100, target: "gh-install-dialog", zoom: 1.45 },
    { at: CONNECTED, target: "gh-card", zoom: 1.5 },
    { at: PROJECT + TRANSITION, target: "proj-card", zoom: 1.4 },
    { at: SYNC + TRANSITION, target: "gh-pr", zoom: 1.6 },
    { at: DONE, target: "task-sync", zoom: 1.5 },
    { at: DONE + 2200, x: 440, y: 275, zoom: 1 },
  ],
  render: (t) => (
    <div className="relative" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
      {[
        { opacity: phase(t, 0, PROJECT), node: <WorkspaceSettings t={t} /> },
        { opacity: phase(t, PROJECT, SYNC), node: <ProjectSettings t={t} /> },
        { opacity: phase(t, SYNC), node: <SyncView t={t} /> },
      ].map(
        ({ opacity, node }, index) =>
          opacity > 0 && (
            <div key={index} className="absolute inset-0" style={{ opacity }}>
              {node}
            </div>
          ),
      )}
    </div>
  ),
};
