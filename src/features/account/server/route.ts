import { Hono } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { Member, MemberRole } from "@/features/members/types";
import { forgetMembers } from "@/features/members/utils";
import { countAdmins, leaveBlocker } from "@/features/members/rules";
import { deleteWorkspaceChildren } from "@/features/workspaces/server/cleanup";

import { createDb } from "@/lib/db";
import { createAdminClient } from "@/lib/appwrite";
import { getAuth, isAuthError, type AuthUser } from "@/lib/auth";
import { avatarUrl } from "@/lib/avatar";
import { forgetUserIdentity } from "@/lib/users";
import { forgetSession, sessionMiddleware } from "@/lib/session-middleware";

import {
  deleteAccountSchema,
  updateEmailSchema,
  updateNameSchema,
  updatePasswordSchema,
} from "../schemas";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

/** Fichier de la photo de profil, gardé dans les préférences du compte. */
const avatarIdOf = (user: Pick<AuthUser, "prefs">) => {
  const value = user.prefs.avatarId;
  return typeof value === "string" && value ? value : null;
};

/** Message d'erreur de connexion lisible, en français. */
const describeError = (error: unknown, fallback: string) => {
  if (isAuthError(error)) {
    switch (error.reason) {
      case "invalid_credentials":
        return "Mot de passe actuel incorrect.";
      case "email_taken":
        return "Cette adresse e-mail est déjà utilisée.";
      case "password_recently_used":
        return "Choisissez un mot de passe que vous n'avez pas utilisé récemment.";
      case "password_personal_data":
        return "Le mot de passe ne doit pas contenir votre nom ou votre e-mail.";
      case "invalid_value":
        return "Valeur invalide.";
    }
  }
  return fallback;
};

/** Les espaces de l'utilisateur, avec son rôle et le nombre de membres et d'admins. */
const getMemberships = async (userId: string) => {
  const { databases } = await createAdminClient();
  const db = createDb(databases);
  const { documents: memberships } = await db.members.list({ where: { userId }, limit: 100 });

  const items = await Promise.all(
    memberships.map(async (membership) => {
      const [workspace, members] = await Promise.all([
        // Une adhésion peut pointer vers un espace déjà supprimé.
        db.workspaces.get(membership.workspaceId).catch(() => null),
        db.members.list({ where: { workspaceId: membership.workspaceId }, limit: 500 }),
      ]);
      if (!workspace) return null;
      return {
        membership,
        workspace,
        memberCount: members.total,
        adminCount: countAdmins(members.documents),
      };
    }),
  );
  return items.filter((item) => item !== null);
};

/** Pourquoi l'utilisateur ne peut pas quitter cet espace, s'il ne peut pas. */
const leaveBlockerFor = (item: { membership: Member; memberCount: number; adminCount: number }) =>
  leaveBlocker({
    role: item.membership.role,
    memberCount: item.memberCount,
    adminCount: item.adminCount,
  });

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    return c.json({
      data: {
        id: user.$id,
        name: user.name,
        email: user.email,
        avatarUrl: avatarUrl(user.$id, avatarIdOf(user)),
        hasPassword: user.hasPassword,
        createdAt: user.createdAt,
      },
    });
  })
  .patch("/name", sessionMiddleware, zValidator("json", updateNameSchema), async (c) => {
    const account = c.get("account");
    const user = c.get("user");
    const { name } = c.req.valid("json");

    await account.updateName(name);
    forgetSession(getCookie(c, AUTH_COOKIE)!);
    forgetUserIdentity(user.$id);

    return c.json({ data: { name } });
  })
  .patch("/email", sessionMiddleware, zValidator("json", updateEmailSchema), async (c) => {
    const account = c.get("account");
    const user = c.get("user");
    const { email, password } = c.req.valid("json");

    try {
      await account.updateEmail(email, password);
    } catch (error) {
      return c.json(
        { error: describeError(error, "Impossible de changer l'adresse e-mail.") },
        400,
      );
    }
    forgetSession(getCookie(c, AUTH_COOKIE)!);
    forgetUserIdentity(user.$id);

    return c.json({ data: { email } });
  })
  .patch("/password", sessionMiddleware, zValidator("json", updatePasswordSchema), async (c) => {
    const account = c.get("account");
    const { password, oldPassword } = c.req.valid("json");

    try {
      await account.updatePassword(password, oldPassword || undefined);
    } catch (error) {
      return c.json({ error: describeError(error, "Impossible de changer le mot de passe.") }, 400);
    }
    forgetSession(getCookie(c, AUTH_COOKIE)!);

    return c.json({ data: { success: true } });
  })
  .post("/avatar", sessionMiddleware, async (c) => {
    const account = c.get("account");
    const user = c.get("user");
    const body = await c.req.parseBody();
    const image = body.image;

    if (!(image instanceof File) || !image.type.startsWith("image/")) {
      return c.json({ error: "Choisissez une image." }, 400);
    }
    if (image.size > MAX_AVATAR_SIZE) {
      return c.json({ error: "L'image ne doit pas dépasser 2 Mo." }, 400);
    }

    // Enregistrée avec la session de l'utilisateur, lisible par tous les utilisateurs connectés.
    const files = c.get("files");
    const file = await files.upload(image, { readableByUsers: true });
    const previous = avatarIdOf(user);

    await account.updatePrefs({ ...user.prefs, avatarId: file.id });
    if (previous) {
      await files.delete(previous).catch(() => undefined);
    }
    forgetSession(getCookie(c, AUTH_COOKIE)!);
    forgetUserIdentity(user.$id);

    return c.json({ data: { avatarUrl: avatarUrl(user.$id, file.id) } });
  })
  .delete("/avatar", sessionMiddleware, async (c) => {
    const account = c.get("account");
    const user = c.get("user");
    const previous = avatarIdOf(user);

    await account.updatePrefs({ ...user.prefs, avatarId: null });
    if (previous) {
      await c
        .get("files")
        .delete(previous)
        .catch(() => undefined);
    }
    forgetSession(getCookie(c, AUTH_COOKIE)!);
    forgetUserIdentity(user.$id);

    return c.json({ data: { avatarUrl: null } });
  })
  .get("/avatar/:userId", sessionMiddleware, async (c) => {
    const { userId } = c.req.param();
    const owner = await getAuth()
      .admin.getUser(userId)
      .catch(() => null);
    const avatarId = owner?.prefs.avatarId;
    if (typeof avatarId !== "string" || !avatarId) {
      return c.json({ error: "Not found" }, 404);
    }

    // La photo est déjà recadrée et réduite par le navigateur avant l'envoi.
    const image = await c
      .get("files")
      .read(avatarId)
      .catch(() => null);
    if (!image) return c.json({ error: "Not found" }, 404);

    // L'adresse change avec la photo : elle peut rester en cache longtemps.
    return c.body(image.data, 200, {
      "Content-Type": image.mimeType || "image/webp",
      "Cache-Control": "private, max-age=31536000, immutable",
    });
  })
  .get("/identities", sessionMiddleware, async (c) => {
    const account = c.get("account");
    const identities = await account.listIdentities();

    return c.json({
      data: identities.map((identity) => ({
        id: identity.id,
        provider: identity.provider,
        email: identity.email,
        createdAt: identity.createdAt,
      })),
    });
  })
  .delete("/identities/:identityId", sessionMiddleware, async (c) => {
    const account = c.get("account");
    const user = c.get("user");
    const { identityId } = c.req.param();
    const identities = await account.listIdentities();

    // Il doit rester une façon de se connecter.
    if (!user.hasPassword && identities.length <= 1) {
      return c.json(
        { error: "Définissez d'abord un mot de passe pour garder un moyen de vous connecter." },
        400,
      );
    }

    await account.deleteIdentity(identityId);
    return c.json({ data: { id: identityId } });
  })
  .get("/workspaces", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const memberships = await getMemberships(user.$id);

    return c.json({
      data: memberships.map((item) => ({
        id: item.workspace.$id,
        name: item.workspace.name,
        imageUrl: item.workspace.imageUrl ?? null,
        role: item.membership.role,
        memberCount: item.memberCount,
        leaveBlocker: leaveBlockerFor(item),
      })),
    });
  })
  .post("/workspaces/:workspaceId/leave", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const { workspaceId } = c.req.param();
    const memberships = await getMemberships(user.$id);
    const item = memberships.find((entry) => entry.workspace.$id === workspaceId);

    if (!item) return c.json({ error: "Espace introuvable." }, 404);
    const blocker = leaveBlockerFor(item);
    if (blocker) return c.json({ error: blocker }, 400);

    const { databases } = await createAdminClient();
    await createDb(databases).members.delete(item.membership.$id);
    forgetMembers(workspaceId);

    return c.json({ data: { id: workspaceId } });
  })
  .delete("/", sessionMiddleware, zValidator("json", deleteAccountSchema), async (c) => {
    const user = c.get("user");
    const { email } = c.req.valid("json");

    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      return c.json({ error: "L'adresse e-mail ne correspond pas à votre compte." }, 400);
    }

    const memberships = await getMemberships(user.$id);
    const blocked = memberships.filter(
      (item) =>
        item.memberCount > 1 && item.membership.role === MemberRole.ADMIN && item.adminCount === 1,
    );
    if (blocked.length > 0) {
      const names = blocked.map((item) => `« ${item.workspace.name} »`).join(", ");
      return c.json(
        {
          error: `Vous êtes le seul administrateur de ${names}. Nommez un autre administrateur ou supprimez ces espaces d'abord.`,
        },
        400,
      );
    }

    // Les espaces sont supprimés avec la session de l'utilisateur, comme depuis leurs paramètres.
    const db = c.get("db");
    const files = c.get("files");
    for (const item of memberships) {
      if (item.memberCount === 1) {
        // Espace où l'utilisateur est seul : supprimé avec le compte.
        await deleteWorkspaceChildren(db, files, item.workspace.$id);
        await db.workspaces.delete(item.workspace.$id);
      } else {
        await db.members.delete(item.membership.$id);
        forgetMembers(item.workspace.$id);
      }
    }

    const avatarId = avatarIdOf(user);
    if (avatarId) {
      await files.delete(avatarId).catch(() => undefined);
    }

    // Sans le droit « users.write » sur la clé d'API Appwrite, le compte est bloqué plutôt que
    // supprimé : la personne ne peut plus se connecter et ses données ont déjà été retirées.
    await getAuth()
      .admin.deleteUser(user.$id)
      .catch(async (error) => {
        if (isAuthError(error, "missing_scope")) {
          console.warn(
            "[account] clé d'API sans users.write : compte bloqué au lieu d'être supprimé",
          );
          await c.get("account").block();
          return;
        }
        throw error;
      });

    const session = getCookie(c, AUTH_COOKIE);
    deleteCookie(c, AUTH_COOKIE);
    if (session) forgetSession(session);
    forgetUserIdentity(user.$id);

    return c.json({ data: { success: true } });
  });

export default app;
