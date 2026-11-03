/**
 * Stockage de fichiers, indépendant du service utilisé. Les routes passent par cette interface ;
 * l'implémentation (Appwrite aujourd'hui, S3 en option) range et relit les fichiers.
 */

export interface UploadOptions {
  /** Identifiant à utiliser (import depuis un autre stockage) ; généré sinon. */
  id?: string;
  /**
   * Lisible par tous les utilisateurs connectés, et pas seulement par son auteur (photo de
   * profil). Sans effet sur S3, où seul le serveur accède aux fichiers.
   */
  readableByUsers?: boolean;
}

export interface StoredFile {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
  name?: string;
}

export interface FileStore {
  upload(file: File, options?: UploadOptions): Promise<{ id: string }>;
  /** Contenu du fichier, ou null s'il n'existe pas. */
  read(id: string): Promise<StoredFile | null>;
  delete(id: string): Promise<void>;
}
