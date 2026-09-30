export const E2E_MARKER = "[E2E]";

export const uniqueName = (prefix: string) =>
  `${E2E_MARKER} ${prefix} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const WORKSPACE_NAME = `${E2E_MARKER} Espace de travail`;
