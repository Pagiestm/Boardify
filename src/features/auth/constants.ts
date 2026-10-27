export const AUTH_COOKIE = "boardify-session";

export const isSecureUrl = (url: string | URL) => new URL(url).protocol === "https:";
