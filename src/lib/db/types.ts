/**
 * Accès aux données, indépendant de la base utilisée. Les requêtes s'écrivent avec ce format
 * neutre ; l'implémentation (Appwrite aujourd'hui) le traduit.
 */

/** Champs communs à tous les documents. */
export interface BaseDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

type Scalar = string | number | boolean;

/**
 * Condition sur un champ :
 * - une valeur : égalité ;
 * - un tableau : la valeur fait partie de la liste (un tableau vide ne renvoie rien) ;
 * - `null` : champ vide ;
 * - `{ gt, gte, lt, lte }` : comparaisons (dates ISO ou nombres) ;
 * - `{ has }` : le champ tableau contient cette valeur (ou l'une de ces valeurs) ;
 * - `{ search }` : le texte contient ce morceau.
 */
export type Condition =
  | Scalar
  | Scalar[]
  | null
  | { gt?: Scalar; gte?: Scalar; lt?: Scalar; lte?: Scalar }
  | { has: Scalar | Scalar[] }
  | { search: string };

type Fields<T> = Exclude<keyof T, symbol>;

export type Where<T> = Partial<Record<Fields<T> | "$id" | "$createdAt" | "$updatedAt", Condition>>;

export type OrderBy<T> = Partial<
  Record<Fields<T> | "$id" | "$createdAt" | "$updatedAt", "asc" | "desc">
>;

export interface ListOptions<T> {
  where?: Where<T>;
  /** Ordre de tri, dans l'ordre des clés. */
  orderBy?: OrderBy<T>;
  /** Nombre maximal de documents (25 par défaut, comme Appwrite). */
  limit?: number;
  /** Pagination : documents situés après celui-ci, dans l'ordre de tri. */
  cursorAfter?: string;
}

export interface ListResult<T> {
  documents: T[];
  total: number;
}

/**
 * Données à écrire : les champs propres au document, sans les champs système. Un champ
 * facultatif peut être vidé avec null.
 */
export type DocumentInput<T> = {
  [K in Exclude<keyof T, keyof BaseDocument | `$${string}`>]?:
    T[K] | (undefined extends T[K] ? null : never);
};

export interface Collection<T extends BaseDocument> {
  /** Faux si la collection n'est pas configurée (collections facultatives). */
  readonly enabled: boolean;
  /** Document par identifiant ; erreur « introuvable » s'il n'existe pas. */
  get(id: string): Promise<T>;
  /** Document par identifiant, ou null s'il n'existe pas. */
  find(id: string): Promise<T | null>;
  list(options?: ListOptions<T>): Promise<ListResult<T>>;
  /** Premier document correspondant, ou null. */
  first(options?: Omit<ListOptions<T>, "limit">): Promise<T | null>;
  count(where?: Where<T>): Promise<number>;
  create(data: DocumentInput<T>, id?: string): Promise<T>;
  update(id: string, data: DocumentInput<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
