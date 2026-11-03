import "server-only";

import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  getTableName,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { newId } from "@/lib/id";

import { NotFoundError } from "./errors";
import { CHANGES_CHANNEL, TABLE_TOPICS, changePayload } from "./changes";
import { BaseDocument, Collection, Condition, DocumentInput, ListOptions, Where } from "./types";

const DEFAULT_LIMIT = 25;

/** Champs système exposés par la couche d'accès, et leur colonne. */
const SYSTEM_FIELDS: Record<string, string> = {
  $id: "id",
  $createdAt: "createdAt",
  $updatedAt: "updatedAt",
};

type Columns = Record<string, PgColumn>;

/** Identifiants au format Appwrite (voir `@/lib/id`), ré-exportés pour les tests. */
export { newId };

const isDateColumn = (column: PgColumn) => column.dataType === "date";

/** Valeur prête pour une colonne : les dates ISO deviennent des Date. */
const toColumnValue = (column: PgColumn, value: unknown) =>
  isDateColumn(column) && typeof value === "string" ? new Date(value) : value;

const columnOf = (columns: Columns, field: string) => {
  const column = columns[SYSTEM_FIELDS[field] ?? field];
  if (!column) throw new Error(`Champ inconnu : ${field}`);
  return column;
};

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Condition SQL d'un champ ; null quand elle ne peut rien renvoyer. */
const conditionToSql = (column: PgColumn, condition: Condition): SQL | null | undefined => {
  if (condition === null) return isNull(column);
  if (Array.isArray(condition)) {
    if (condition.length === 0) return null;
    return inArray(
      column,
      condition.map((value) => toColumnValue(column, value)),
    );
  }
  if (typeof condition !== "object") return eq(column, toColumnValue(column, condition));
  if ("has" in condition) {
    const values = Array.isArray(condition.has) ? condition.has : [condition.has];
    return values.length === 0 ? null : arrayOverlaps(column, values);
  }
  if ("search" in condition) return ilike(column, `%${escapeLike(condition.search)}%`);

  const parts: SQL[] = [];
  if (condition.gt !== undefined) parts.push(gt(column, toColumnValue(column, condition.gt)));
  if (condition.gte !== undefined) parts.push(gte(column, toColumnValue(column, condition.gte)));
  if (condition.lt !== undefined) parts.push(lt(column, toColumnValue(column, condition.lt)));
  if (condition.lte !== undefined) parts.push(lte(column, toColumnValue(column, condition.lte)));
  return and(...parts);
};

/** Filtre SQL correspondant à `where` ; null quand le résultat est forcément vide. */
export const whereToSql = <T>(columns: Columns, where: Where<T> = {}): SQL | null | undefined => {
  const parts: SQL[] = [];
  for (const [field, condition] of Object.entries(where) as [string, Condition | undefined][]) {
    if (condition === undefined) continue;
    const translated = conditionToSql(columnOf(columns, field), condition);
    if (translated === null) return null;
    if (translated) parts.push(translated);
  }
  return parts.length > 0 ? and(...parts) : undefined;
};

type Sort = { column: PgColumn; direction: "asc" | "desc" };

/** Ordre de tri, toujours départagé par l'identifiant pour une pagination stable. */
export const sortOf = <T>(columns: Columns, orderBy: ListOptions<T>["orderBy"] = {}): Sort[] => {
  const sort = Object.entries(orderBy).map(([field, direction]) => ({
    column: columnOf(columns, field),
    direction: direction === "desc" ? ("desc" as const) : ("asc" as const),
  }));
  if (!sort.some((entry) => entry.column === columns.id)) {
    sort.push({ column: columns.id, direction: "asc" });
  }
  return sort;
};

/**
 * Lignes situées après le curseur dans l'ordre de tri (pagination « keyset »). Postgres range
 * les valeurs vides en dernier dans l'ordre croissant et en premier dans l'ordre décroissant.
 */
export const afterCursor = (sort: Sort[], cursor: Record<string, unknown>): SQL | undefined => {
  const valueOf = (column: PgColumn) => cursor[column.name] ?? null;
  const branches: SQL[] = [];

  sort.forEach(({ column, direction }, index) => {
    const value = valueOf(column);
    let next: SQL | undefined;
    if (direction === "asc") {
      if (value !== null) {
        next = column.notNull ? gt(column, value) : or(gt(column, value), isNull(column));
      }
    } else {
      next = value === null ? isNotNull(column) : lt(column, value);
    }
    if (!next) return;

    const same = sort.slice(0, index).map(({ column: previous }) => {
      const previousValue = valueOf(previous);
      return previousValue === null ? isNull(previous) : eq(previous, previousValue);
    });
    branches.push(and(...same, next)!);
  });

  return or(...branches);
};

/** Document au format de la couche d'accès : champs système préfixés, dates en ISO. */
const toDocument = <T>(row: Record<string, unknown>): T => {
  const { id, createdAt, updatedAt, ...fields } = row;
  const document: Record<string, unknown> = {
    $id: id,
    $createdAt: (createdAt as Date).toISOString(),
    $updatedAt: (updatedAt as Date).toISOString(),
  };
  for (const [key, value] of Object.entries(fields)) {
    document[key] = value instanceof Date ? value.toISOString() : value;
  }
  return document as T;
};

/** Données à écrire, avec les dates converties ; les champs inconnus sont refusés. */
const toRow = (columns: Columns, data: Record<string, unknown>) => {
  const row: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (field.startsWith("$") || !columns[field]) throw new Error(`Champ inconnu : ${field}`);
    row[field] = toColumnValue(columns[field], value);
  }
  return row;
};

/** Table Postgres exposée avec le format neutre. */
export const postgresCollection = <T extends BaseDocument>(
  db: () => PostgresJsDatabase,
  table: PgTable,
): Collection<T> => {
  const columns = getTableColumns(table) as Columns;
  const id = columns.id;
  const topic = TABLE_TOPICS[getTableName(table)];

  /** Annonce l'écriture au temps réel ; un échec n'annule jamais l'écriture. */
  const announce = async (row: Record<string, unknown>) => {
    const payload = topic && changePayload(topic, row);
    if (!payload) return;
    try {
      await db().execute(sql`select pg_notify(${CHANGES_CHANNEL}, ${JSON.stringify(payload)})`);
    } catch (error) {
      console.error("[realtime] annonce impossible", error);
    }
  };

  const find = async (documentId: string) => {
    const [row] = await db().select().from(table).where(eq(id, documentId)).limit(1);
    return row ? toDocument<T>(row) : null;
  };

  const list = async (options: ListOptions<T> = {}) => {
    const filter = whereToSql(columns, options.where);
    if (filter === null) return { documents: [] as T[], total: 0 };

    const sort = sortOf(columns, options.orderBy);
    let pageFilter = filter;
    if (options.cursorAfter) {
      const [cursor] = await db()
        .select(Object.fromEntries(sort.map(({ column }) => [column.name, column])))
        .from(table)
        .where(eq(id, options.cursorAfter))
        .limit(1);
      if (!cursor) throw new Error(`Curseur introuvable : ${options.cursorAfter}`);
      pageFilter = and(filter, afterCursor(sort, cursor));
    }

    const [rows, [{ total }]] = await Promise.all([
      db()
        .select()
        .from(table)
        .where(pageFilter)
        .orderBy(
          ...sort.map(({ column, direction }) =>
            direction === "desc" ? desc(column) : asc(column),
          ),
        )
        .limit(options.limit ?? DEFAULT_LIMIT),
      db().select({ total: count() }).from(table).where(filter),
    ]);
    return { documents: rows.map((row) => toDocument<T>(row)), total };
  };

  return {
    enabled: true,
    get: async (documentId) => {
      const document = await find(documentId);
      if (!document) throw new NotFoundError();
      return document;
    },
    find,
    list,
    first: async (options) => (await list({ ...options, limit: 1 })).documents[0] ?? null,
    count: async (where) => {
      const filter = whereToSql(columns, where);
      if (filter === null) return 0;
      const [{ total }] = await db().select({ total: count() }).from(table).where(filter);
      return total;
    },
    create: async (data: DocumentInput<T>, documentId?: string) => {
      const [row] = await db()
        .insert(table)
        .values({ ...toRow(columns, data), id: documentId ?? newId() })
        .returning();
      await announce(row);
      return toDocument<T>(row);
    },
    update: async (documentId, data) => {
      const [row] = await db()
        .update(table)
        .set({ ...toRow(columns, data), updatedAt: new Date() })
        .where(eq(id, documentId))
        .returning();
      if (!row) throw new NotFoundError();
      await announce(row);
      return toDocument<T>(row);
    },
    delete: async (documentId) => {
      const [row] = await db().delete(table).where(eq(id, documentId)).returning();
      if (!row) throw new NotFoundError();
      await announce(row);
    },
  };
};
