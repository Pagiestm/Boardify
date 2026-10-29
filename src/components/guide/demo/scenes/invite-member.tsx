import {
  CheckIcon,
  CopyIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UserMinusIcon,
} from "lucide-react";

import { cn, getAvatarColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo";
import { MiniAvatar } from "@/components/landing/preview-data";

import { AppFrame, MockButton, MockField, MockToast, highlight } from "../mock";
import { DemoScene, STAGE_HEIGHT, STAGE_WIDTH, between, fadeIn, progress } from "../timeline";

const WORKSPACE = "Équipe produit";
const INVITE_LINK = "https://boardify.theotimepagies.com/workspaces/6abe5c0f/join/k3f9x2";
const FADE = 300;

const MEMBERS = [
  { id: "lea", name: "Léa Martin", email: "lea@studio-nova.fr", admin: true },
  { id: "sam", name: "Sam Durand", email: "sam@studio-nova.fr", admin: false },
  { id: "hugo", name: "Hugo Petit", email: "hugo@studio-nova.fr", admin: false },
  { id: "nora", name: "Nora Benali", email: "nora@studio-nova.fr", admin: false },
];

/** Opacité d'une page affichée de `start` à `end`, avec fondu enchaîné. */
const pageOpacity = (t: number, start: number, end = Infinity) => {
  if (t < start || t >= end + FADE) return 0;
  const enter = start === 0 ? 1 : fadeIn(t, start, FADE);
  const leave = end === Infinity ? 1 : 1 - progress(t, end, end + FADE);
  return Math.min(enter, leave);
};

/** Page sans barre latérale (paramètres, membres, invitation), comme dans l'application. */
const StandalonePage = ({
  user,
  opacity,
  browserUrl,
  children,
}: {
  user: string;
  opacity: number;
  browserUrl?: string;
  children: React.ReactNode;
}) =>
  opacity > 0 ? (
    <div
      className="absolute inset-0 flex flex-col bg-background text-foreground"
      style={{ opacity, width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {browserUrl && (
        <div className="flex h-9 shrink-0 items-center gap-3 border-b bg-muted px-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-green-500" />
          </span>
          <span className="flex-1 truncate rounded-md bg-background px-3 py-1 text-[11px] text-muted-foreground">
            {browserUrl}
          </span>
        </div>
      )}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-8">
        <span className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span className="text-sm font-semibold">Boardify</span>
        </span>
        <MiniAvatar name={user} className="size-6 text-[11px]" />
      </header>
      <main className="flex flex-1 flex-col items-center gap-4 bg-muted/40 px-8 py-6">
        {children}
      </main>
    </div>
  ) : null;

const T = {
  openSettings: 1100,
  settings: 1250,
  copyMove: 2000,
  copy: 2700,
  join: 5000,
} as const;
const JOIN_MOVE = T.join + 600;
const CLICK_JOIN = JOIN_MOVE + 1100;
const MEMBERS_PAGE = CLICK_JOIN + 400;
const MENU_MOVE = MEMBERS_PAGE + 1300;
const CLICK_MENU = MENU_MOVE + 700;
const ADMIN_MOVE = CLICK_MENU + 450;
const CLICK_ADMIN = ADMIN_MOVE + 900;
const END = CLICK_ADMIN + 2800;

export const inviteMemberScene: DemoScene = {
  id: "invite-member",
  title: "Inviter un membre",
  duration: END,
  steps: [
    { at: 0, label: "Ouvrez Paramètres" },
    { at: T.settings + 300, label: "Copiez le lien d'invitation" },
    { at: T.join, label: "Votre collègue ouvre le lien et rejoint l'espace" },
    { at: MEMBERS_PAGE, label: "Il apparaît dans Membres" },
    { at: MENU_MOVE, label: "Changez son rôle avec le menu …" },
  ],
  clicks: [T.openSettings, T.copy, CLICK_JOIN, CLICK_MENU, CLICK_ADMIN],
  cursor: [
    { at: 0, x: 520, y: 300 },
    { at: 350, target: "nav-Paramètres" },
    { at: T.copyMove, target: "copy-link", duration: 700 },
    { at: JOIN_MOVE, target: "btn-join", duration: 900 },
    { at: MENU_MOVE, target: "member-menu-nora" },
    { at: ADMIN_MOVE, target: "opt-admin", duration: 500 },
    { at: CLICK_ADMIN + 400, target: "member-nora", dx: 40, dy: 40 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: 200, target: "nav-Paramètres", zoom: 1.5, duration: 800 },
    { at: T.settings, x: 440, y: 275, zoom: 1, duration: 500 },
    { at: T.settings + 500, target: "invite-card", zoom: 1.5 },
    { at: T.join - 400, x: 440, y: 275, zoom: 1, duration: 600 },
    { at: T.join + 300, target: "join-card", zoom: 1.45 },
    { at: MEMBERS_PAGE, x: 440, y: 275, zoom: 1, duration: 500 },
    { at: MEMBERS_PAGE + 500, target: "members-card", zoom: 1.35 },
    { at: CLICK_MENU + 50, target: "member-menu-panel", zoom: 1.6 },
    { at: CLICK_ADMIN + 400, target: "member-nora", zoom: 1.5 },
  ],
  render: (t) => {
    const copied = t >= T.copy;
    const menuOpen = between(t, CLICK_MENU, CLICK_ADMIN + 100);
    const noraAdmin = t >= CLICK_ADMIN + 100;

    return (
      <div className="relative" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
        {pageOpacity(t, 0, T.settings) > 0 && (
          <div className="absolute inset-0" style={{ opacity: pageOpacity(t, 0, T.settings) }}>
            <AppFrame title="Accueil" active="Accueil">
              <div className="grid grid-cols-2 gap-3">
                {["Tâches", "Assignées"].map((card) => (
                  <div key={card} className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{card}</p>
                    <p className="mt-1 text-2xl font-semibold">12</p>
                  </div>
                ))}
                <div className="col-span-2 h-56 rounded-lg border bg-card p-4">
                  <p className="text-sm font-semibold">Activité</p>
                  <p className="text-xs text-muted-foreground">Tâches créées sur 30 jours</p>
                </div>
              </div>
            </AppFrame>
          </div>
        )}

        <StandalonePage user="Léa" opacity={pageOpacity(t, T.settings, T.join)}>
          <div className="w-[560px] overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-col gap-1 px-5 pt-5 pb-4">
              <span className="text-base font-semibold">Paramètres de l&apos;espace</span>
              <span className="text-xs text-muted-foreground">
                Modifiez le nom et l&apos;icône de{" "}
                <span className="font-medium text-foreground">{WORKSPACE}</span>.
              </span>
            </div>
            <MockField className="px-5 pb-4" label="Nom de l'espace de travail" value={WORKSPACE} />
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <MockButton variant="ghost">Annuler</MockButton>
              <MockButton>Enregistrer</MockButton>
            </div>
          </div>
          <div
            data-demo="invite-card"
            className="flex w-[560px] flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs"
          >
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Inviter des membres</span>
              <span className="text-xs text-muted-foreground">
                Partagez ce lien pour permettre à vos collègues de rejoindre l&apos;espace.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 min-w-0 flex-1 items-center truncate rounded-md border bg-background px-2.5 text-xs text-muted-foreground",
                  between(t, T.copy, T.copy + 1200) && "bg-primary/5",
                )}
              >
                {INVITE_LINK}
              </span>
              <span
                data-demo="copy-link"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md border bg-background",
                  between(t, T.copyMove + 600, T.copy + 200) && "bg-accent",
                )}
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-primary" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </span>
            </div>
            <MockButton variant="outline" size="sm" className="w-fit">
              <RefreshCwIcon />
              Réinitialiser le lien
            </MockButton>
          </div>
        </StandalonePage>

        <StandalonePage
          user="Nora"
          browserUrl={INVITE_LINK}
          opacity={pageOpacity(t, T.join, MEMBERS_PAGE)}
        >
          <div
            data-demo="join-card"
            className="mt-8 w-[420px] overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <div className="flex flex-col items-center gap-3 px-6 pt-7 pb-5 text-center">
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-md text-xl font-semibold",
                  getAvatarColor(WORKSPACE),
                )}
              >
                É
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Vous êtes invité à rejoindre</span>
                <span className="text-lg font-semibold tracking-tight">{WORKSPACE}</span>
              </div>
              <span className="max-w-xs text-xs text-muted-foreground">
                En rejoignant cet espace de travail, vous aurez accès à ses projets et à ses tâches.
              </span>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <MockButton variant="ghost">Refuser</MockButton>
              <MockButton demo="btn-join" hover={between(t, CLICK_JOIN - 400, CLICK_JOIN + 200)}>
                Rejoindre l&apos;espace
              </MockButton>
            </div>
          </div>
        </StandalonePage>

        <StandalonePage user="Léa" opacity={pageOpacity(t, MEMBERS_PAGE)}>
          <div data-demo="members-card" className="w-[560px] rounded-xl border bg-card shadow-xs">
            <div className="flex flex-col gap-1 px-5 pt-5 pb-4">
              <span className="text-base font-semibold">Membres</span>
              <span className="text-xs text-muted-foreground">
                {MEMBERS.length} membres dans cet espace de travail
              </span>
            </div>
            <ul className="divide-y border-t">
              {MEMBERS.map((member) => {
                const isNora = member.id === "nora";
                const admin = member.admin || (isNora && noraAdmin);
                return (
                  <li
                    key={member.id}
                    data-demo={`member-${member.id}`}
                    className={cn(
                      "relative flex items-center gap-3 px-5 py-2.5",
                      isNora && t < MEMBERS_PAGE + 2400 && "bg-primary/5",
                    )}
                    style={
                      isNora
                        ? highlight(progress(t, MEMBERS_PAGE + 300, MEMBERS_PAGE + 2100))
                        : undefined
                    }
                  >
                    <MiniAvatar name={member.name} className="size-8 text-xs" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{member.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{member.email}</span>
                    </div>
                    <span
                      className="rounded-md"
                      style={
                        isNora
                          ? highlight(progress(t, CLICK_ADMIN + 100, CLICK_ADMIN + 1500))
                          : undefined
                      }
                    >
                      <Badge variant={admin ? "soft" : "secondary"}>
                        {admin ? "Admin" : "Membre"}
                      </Badge>
                    </span>
                    <span
                      data-demo={isNora ? "member-menu-nora" : undefined}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md text-muted-foreground",
                        isNora && between(t, MENU_MOVE + 500, CLICK_ADMIN + 100) && "bg-accent",
                      )}
                    >
                      <MoreHorizontalIcon className="size-4" />
                    </span>
                    {isNora && menuOpen && (
                      <div
                        data-demo="member-menu-panel"
                        className="absolute top-full right-5 z-20 -mt-1 flex w-56 flex-col rounded-lg border bg-popover p-1 shadow-lg"
                        style={{ opacity: fadeIn(t, CLICK_MENU, 150) }}
                      >
                        <span className="px-2 py-1.5 text-xs font-medium">Rôle</span>
                        <span
                          data-demo="opt-admin"
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                            t >= ADMIN_MOVE + 400 && "bg-accent",
                          )}
                        >
                          <ShieldCheckIcon className="size-3.5 text-muted-foreground" />
                          Définir comme administrateur
                        </span>
                        <span className="-mx-1 my-1 h-px bg-border" />
                        <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive">
                          <UserMinusIcon className="size-3.5" />
                          Retirer {member.name}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </StandalonePage>

        <MockToast visible={between(t, T.copy, T.copy + 2200) ? fadeIn(t, T.copy) : 0}>
          Lien d&apos;invitation copié dans le presse-papiers
        </MockToast>
        <MockToast visible={between(t, CLICK_ADMIN + 100, END) ? fadeIn(t, CLICK_ADMIN + 100) : 0}>
          Membre mis à jour
        </MockToast>
      </div>
    );
  },
};
