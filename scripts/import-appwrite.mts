/**
 * Copie les données d'Appwrite vers Postgres, en gardant les identifiants : les liens, favoris
 * et URL existants restent valables. Peut être relancé : les lignes déjà copiées sont mises à jour.
 *
 *   npm run db:import-appwrite              copie tout
 *   npm run db:import-appwrite -- --dry-run compte et vérifie sans rien écrire
 *
 * Les comptes sont copiés aussi (tables de Better Auth) : identifiant, nom, e-mail, préférences,
 * comptes Google et GitHub reliés et mot de passe (Argon2, vérifié tel quel par Better Auth). Les
 * sessions ne le sont pas : chacun se reconnecte une fois après la bascule.
 *
 * Lit .env.local : variables Appwrite (clé d'API comprise) et DATABASE_URL.
 */
import postgres from "postgres";
import { getTableColumns, getTableName, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { Client, Databases, Query, Users, type Models } from "node-appwrite";

import * as schema from "../src/lib/db/schema.ts";

const dryRun = process.argv.includes("--dry-run");
const env = (name: string) => process.env[name] || undefined;

/** Table Postgres et variable de la collection Appwrite correspondante. */
const COLLECTIONS: [PgTable, string][] = [
  [schema.workspaces, "NEXT_PUBLIC_APPWRITE_WORKSPACES_ID"],
  [schema.members, "NEXT_PUBLIC_APPWRITE_MEMBERS_ID"],
  [schema.projects, "NEXT_PUBLIC_APPWRITE_PROJECTS_ID"],
  [schema.tasks, "NEXT_PUBLIC_APPWRITE_TASKS_ID"],
  [schema.labels, "NEXT_PUBLIC_APPWRITE_LABELS_ID"],
  [schema.comments, "NEXT_PUBLIC_APPWRITE_COMMENTS_ID"],
  [schema.activities, "NEXT_PUBLIC_APPWRITE_ACTIVITIES_ID"],
  [schema.notifications, "NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_ID"],
  [schema.checklistItems, "NEXT_PUBLIC_APPWRITE_CHECKLIST_ITEMS_ID"],
  [schema.attachments, "NEXT_PUBLIC_APPWRITE_ATTACHMENTS_ID"],
  [schema.taskTemplates, "NEXT_PUBLIC_APPWRITE_TASK_TEMPLATES_ID"],
  [schema.savedViews, "NEXT_PUBLIC_APPWRITE_SAVED_VIEWS_ID"],
  [schema.sprints, "NEXT_PUBLIC_APPWRITE_SPRINTS_ID"],
  [schema.aiSettings, "NEXT_PUBLIC_APPWRITE_AI_SETTINGS_ID"],
  [schema.presence, "NEXT_PUBLIC_APPWRITE_PRESENCE_ID"],
  [schema.timeEntries, "NEXT_PUBLIC_APPWRITE_TIME_ENTRIES_ID"],
  [schema.reminders, "NEXT_PUBLIC_APPWRITE_REMINDERS_ID"],
  [schema.pokerSessions, "NEXT_PUBLIC_APPWRITE_POKER_SESSIONS_ID"],
  [schema.pokerVotes, "NEXT_PUBLIC_APPWRITE_POKER_VOTES_ID"],
  [schema.docs, "NEXT_PUBLIC_APPWRITE_DOCS_ID"],
  [schema.intakeForms, "NEXT_PUBLIC_APPWRITE_INTAKE_FORMS_ID"],
  [schema.retroItems, "NEXT_PUBLIC_APPWRITE_RETRO_ITEMS_ID"],
];

const PAGE = 100;

const appwrite = new Client()
  .setEndpoint(env("NEXT_PUBLIC_APPWRITE_ENDPOINT")!)
  .setProject(env("NEXT_PUBLIC_APPWRITE_PROJECT")!)
  .setKey(env("NEXT_APPWRITE_KEY")!);
const databases = new Databases(appwrite);
const users = new Users(appwrite);
const databaseId = env("NEXT_PUBLIC_APPWRITE_DATABASE_ID")!;

const client = dryRun ? null : postgres(env("DATABASE_URL")!, { max: 1 });
const db = client ? drizzle({ client }) : null;

/** Tous les documents d'une collection, page par page. */
async function* documentsOf(collectionId: string) {
  let cursor: string | undefined;
  do {
    const queries = [Query.limit(PAGE), ...(cursor ? [Query.cursorAfter(cursor)] : [])];
    const { documents } = await databases.listDocuments(databaseId, collectionId, queries);
    yield documents;
    cursor = documents.length === PAGE ? documents[PAGE - 1].$id : undefined;
  } while (cursor);
}

/** Ligne Postgres d'un document ; les champs absents prennent la valeur par défaut de la table. */
const toRow = (columns: Record<string, PgColumn>, document: Models.Document) => {
  const source: Record<string, unknown> = {
    ...document,
    id: document.$id,
    createdAt: document.$createdAt,
    updatedAt: document.$updatedAt,
  };
  const row: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(columns)) {
    const value = source[key];
    if (value === undefined || (value === null && column.notNull)) continue;
    row[key] = column.dataType === "date" && typeof value === "string" ? new Date(value) : value;
  }
  return row;
};

let failed = false;

for (const [table, variable] of COLLECTIONS) {
  const collectionId = env(variable);
  const columns = getTableColumns(table) as Record<string, PgColumn>;
  const name = getTableName(table);
  if (!collectionId) {
    console.log(`- ${name} : collection non configurée, ignorée`);
    continue;
  }

  const unknown = new Set<string>();
  let copied = 0;
  for await (const documents of documentsOf(collectionId)) {
    for (const document of documents) {
      for (const key of Object.keys(document)) {
        if (!key.startsWith("$") && !(key in columns)) unknown.add(key);
      }
    }
    if (db && documents.length > 0) {
      const set = Object.fromEntries(
        Object.entries(columns)
          .filter(([key]) => key !== "id")
          .map(([key, column]) => [key, sql.raw(`excluded."${column.name}"`)]),
      );
      await db
        .insert(table)
        .values(documents.map((document) => toRow(columns, document)))
        .onConflictDoUpdate({ target: columns.id, set });
    }
    copied += documents.length;
  }

  let line = `- ${name} : ${copied} document${copied > 1 ? "s" : ""}`;
  if (db) {
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(table);
    line += ` → ${total} ligne${total > 1 ? "s" : ""} dans Postgres`;
    if (total < copied) failed = true;
  }
  if (unknown.size > 0) line += ` (champs non repris : ${[...unknown].join(", ")})`;
  console.log(line);
}

/** Comptes Appwrite → tables de Better Auth. */
const importUsers = async () => {
  const all: Models.User<Models.Preferences>[] = [];
  let cursor: string | undefined;
  do {
    const queries = [Query.limit(PAGE), ...(cursor ? [Query.cursorAfter(cursor)] : [])];
    const page = await users.list(queries);
    all.push(...page.users);
    cursor = page.users.length === PAGE ? page.users[PAGE - 1].$id : undefined;
  } while (cursor);

  const withPassword = all.filter((user) => user.password && user.hash === "argon2");
  const otherHashes = all.filter((user) => user.password && user.hash !== "argon2");
  let identities = 0;

  for (const user of all) {
    const { identities: linked } = await users.listIdentities([
      Query.equal("userId", user.$id),
      Query.limit(25),
    ]);
    identities += linked.length;
    if (!db) continue;

    const row = {
      id: user.$id,
      name: user.name,
      email: user.email.toLowerCase(),
      emailVerified: user.emailVerification,
      prefs: JSON.stringify(user.prefs ?? {}),
      createdAt: new Date(user.$createdAt),
      updatedAt: new Date(user.$updatedAt),
    };
    await db
      .insert(schema.authUsers)
      .values(row)
      .onConflictDoUpdate({ target: schema.authUsers.id, set: row });

    const accounts = [
      ...(user.password && user.hash === "argon2"
        ? [
            {
              id: `${user.$id}-credential`,
              providerId: "credential",
              accountId: user.$id,
              password: user.password,
            },
          ]
        : []),
      ...linked.map((identity) => ({
        id: identity.$id,
        providerId: identity.provider,
        accountId: identity.providerUid,
        password: null,
      })),
    ];
    for (const account of accounts) {
      const values = { ...account, userId: user.$id };
      await db
        .insert(schema.authAccounts)
        .values(values)
        .onConflictDoUpdate({ target: schema.authAccounts.id, set: values });
    }
  }

  console.log(
    `- comptes : ${all.length} utilisateur${all.length > 1 ? "s" : ""}, ${withPassword.length} mot${withPassword.length > 1 ? "s" : ""} de passe, ${identities} compte${identities > 1 ? "s" : ""} Google/GitHub`,
  );
  if (otherHashes.length > 0) {
    console.log(
      `  ${otherHashes.length} mot(s) de passe dans un autre format que Argon2 : ces personnes passeront par « Mot de passe oublié ».`,
    );
  }
};

try {
  await importUsers();
} catch (error) {
  const scope = (error as { type?: string }).type === "general_unauthorized_scope";
  console.log(
    scope
      ? "- comptes : ignorés, la clé d'API n'a pas le droit users.read"
      : `- comptes : échec (${(error as Error).message})`,
  );
  if (!scope) failed = true;
}

await client?.end();
console.log(dryRun ? "\nSimulation : rien n'a été écrit." : "\nImport terminé.");
if (failed) {
  console.error("Certaines tables ont moins de lignes que de documents Appwrite.");
  process.exit(1);
}
