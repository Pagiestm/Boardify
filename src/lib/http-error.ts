export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const httpErrorMessage = (status: number, fallback: string) => {
  if (status === 429) return "Trop de requêtes, réessayez dans un instant";
  if (status === 401) return "Session expirée, reconnectez-vous";
  return fallback;
};
