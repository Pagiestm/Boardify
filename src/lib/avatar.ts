/** Adresse de la photo de profil, versionnée par le fichier pour pouvoir la garder en cache. */
export const avatarUrl = (userId: string, avatarId: unknown) =>
  typeof avatarId === "string" && avatarId
    ? `/api/account/avatar/${userId}?v=${avatarId}`
    : undefined;
