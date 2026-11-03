import "server-only";

import { ID, Query, type Databases, type Models } from "node-appwrite";

import { BaseDocument, Collection, Condition, ListOptions } from "./types";
import { isNotFound } from "./errors";

const isRange = (
  value: object,
): value is { gt?: unknown; gte?: unknown; lt?: unknown; lte?: unknown } =>
  "gt" in value || "gte" in value || "lt" in value || "lte" in value;

type QueryValue = string | number | boolean;

/** Traduit une condition en requêtes Appwrite ; null si elle ne peut rien renvoyer. */
const conditionToQueries = (field: string, condition: Condition): string[] | null => {
  if (condition === null) return [Query.isNull(field)];
  if (Array.isArray(condition)) {
    return condition.length === 0 ? null : [Query.equal(field, condition as QueryValue[])];
  }
  if (typeof condition !== "object") return [Query.equal(field, condition)];
  if ("has" in condition) {
    const values = Array.isArray(condition.has) ? condition.has : [condition.has];
    return values.length === 0 ? null : [Query.contains(field, values as QueryValue[])];
  }
  if ("search" in condition) return [Query.contains(field, condition.search)];
  if (isRange(condition)) {
    const queries: string[] = [];
    if (condition.gt !== undefined)
      queries.push(Query.greaterThan(field, condition.gt as QueryValue));
    if (condition.gte !== undefined) {
      queries.push(Query.greaterThanEqual(field, condition.gte as QueryValue));
    }
    if (condition.lt !== undefined) queries.push(Query.lessThan(field, condition.lt as QueryValue));
    if (condition.lte !== undefined)
      queries.push(Query.lessThanEqual(field, condition.lte as QueryValue));
    return queries;
  }
  return [];
};

/**
 * Requêtes Appwrite correspondant aux options ; null quand le résultat est forcément vide
 * (une liste de valeurs vide, par exemple).
 */
export const toQueries = <T>(options: ListOptions<T> = {}): string[] | null => {
  const queries: string[] = [];
  for (const [field, condition] of Object.entries(options.where ?? {}) as [string, Condition][]) {
    if (condition === undefined) continue;
    const translated = conditionToQueries(field, condition);
    if (!translated) return null;
    queries.push(...translated);
  }
  for (const [field, direction] of Object.entries(options.orderBy ?? {})) {
    queries.push(direction === "desc" ? Query.orderDesc(field) : Query.orderAsc(field));
  }
  if (options.limit !== undefined) queries.push(Query.limit(options.limit));
  if (options.cursorAfter) queries.push(Query.cursorAfter(options.cursorAfter));
  return queries;
};

/** Collection Appwrite exposée avec le format neutre. */
export const appwriteCollection = <T extends BaseDocument>(
  databases: Databases,
  databaseId: string,
  collectionId: string | undefined,
): Collection<T> => {
  const id = () => {
    if (!collectionId) throw new Error("Collection non configurée");
    return collectionId;
  };
  type Doc = T & Models.Document;

  const list = async (options?: ListOptions<T>) => {
    const queries = toQueries(options);
    if (!queries) return { documents: [] as T[], total: 0 };
    const result = await databases.listDocuments<Doc>(databaseId, id(), queries);
    return { documents: result.documents as T[], total: result.total };
  };

  return {
    enabled: Boolean(collectionId),
    get: async (documentId) =>
      (await databases.getDocument<Doc>(databaseId, id(), documentId)) as T,
    find: async (documentId) => {
      try {
        return (await databases.getDocument<Doc>(databaseId, id(), documentId)) as T;
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    list,
    first: async (options) => (await list({ ...options, limit: 1 })).documents[0] ?? null,
    count: async (where) => (await list({ where, limit: 1 })).total,
    // Les documents Appwrite sont typés à partir du nôtre : la conversion est sûre.
    create: async (data, documentId) =>
      (await databases.createDocument(
        databaseId,
        id(),
        documentId ?? ID.unique(),
        data as Record<string, unknown>,
      )) as unknown as T,
    update: async (documentId, data) =>
      (await databases.updateDocument(
        databaseId,
        id(),
        documentId,
        data as Record<string, unknown>,
      )) as unknown as T,
    delete: async (documentId) => {
      await databases.deleteDocument(databaseId, id(), documentId);
    },
  };
};
