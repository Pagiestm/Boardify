import "server-only";

import { createHmac, createSign, timingSafeEqual } from "crypto";

const GITHUB_API = "https://api.github.com";

const ISSUE_URL_PATTERN = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)$/;

const REPOSITORIES_LIMIT = 300;

type IssueState = "open" | "closed";

const appConfig = () => {
  const {
    GITHUB_APP_SLUG: slug,
    GITHUB_APP_CLIENT_ID: clientId,
    GITHUB_APP_CLIENT_SECRET: clientSecret,
    GITHUB_APP_PRIVATE_KEY: privateKey,
  } = process.env;

  if (!slug || !clientId || !clientSecret || !privateKey) return null;

  return {
    slug: slug.replace(/^https:\/\/github\.com\/apps\//, "").replace(/\/+$/, ""),
    clientId,
    clientSecret,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
};

const requireAppConfig = () => {
  const config = appConfig();
  if (!config) throw new Error("GitHub App non configurée");
  return config;
};

export const isGithubAppConfigured = () => appConfig() !== null;

export const getGithubBotLogin = () => `${requireAppConfig().slug}[bot]`;

export const verifyGithubWebhook = (payload: string, signature: string | undefined) => {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;

  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`,
  );
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const getGithubInstallUrl = (state: string) =>
  `https://github.com/apps/${requireAppConfig().slug}/installations/new?state=${encodeURIComponent(state)}`;

const githubFetch = async <T>(
  path: string,
  { token, method = "GET", body }: { token: string; method?: string; body?: unknown },
) => {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub ${method} ${path} : ${response.status} ${await response.text()}`);
  }

  return (response.status === 204 ? null : await response.json()) as T;
};

const base64Url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

const createAppJwt = () => {
  const { clientId, privateKey } = requireAppConfig();
  const now = Math.floor(Date.now() / 1000);

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: clientId }));
  const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey);

  return `${header}.${payload}.${base64Url(signature)}`;
};

const installationTokens = new Map<string, { token: string; expiresAt: number }>();

const getInstallationToken = async (installationId: string) => {
  const cached = installationTokens.get(installationId);
  if (cached && cached.expiresAt - Date.now() > 5 * 60 * 1000) return cached.token;

  const { token, expires_at } = await githubFetch<{ token: string; expires_at: string }>(
    `/app/installations/${installationId}/access_tokens`,
    { token: createAppJwt(), method: "POST" },
  );

  installationTokens.set(installationId, { token, expiresAt: new Date(expires_at).getTime() });
  return token;
};

export const getGithubInstallation = async (installationId: string) => {
  const installation = await githubFetch<{ html_url: string; account: { login: string } | null }>(
    `/app/installations/${installationId}`,
    { token: createAppJwt() },
  );

  return { account: installation.account?.login ?? null, htmlUrl: installation.html_url };
};

export const listGithubRepositories = async (installationId: string) => {
  const token = await getInstallationToken(installationId);
  const repositories: string[] = [];

  for (let page = 1; repositories.length < REPOSITORIES_LIMIT; page++) {
    const { repositories: batch } = await githubFetch<{
      repositories: { full_name: string }[];
    }>(`/installation/repositories?per_page=100&page=${page}`, { token });

    repositories.push(...batch.map((repository) => repository.full_name));
    if (batch.length < 100) break;
  }

  return repositories.sort((a, b) => a.localeCompare(b));
};

const exchangeOAuthCode = async (code: string) => {
  const { clientId, clientSecret } = requireAppConfig();

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    cache: "no-store",
  });
  const { access_token: userToken } = (await response.json()) as { access_token?: string };

  return userToken ?? null;
};

export const getGithubOAuthUrl = (state: string, redirectUri: string) => {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", requireAppConfig().clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
};

export const listUserInstallationIds = async (code: string) => {
  const userToken = await exchangeOAuthCode(code);
  if (!userToken) return [];

  const installationIds: string[] = [];

  for (let page = 1; ; page++) {
    const { installations } = await githubFetch<{ installations: { id: number }[] }>(
      `/user/installations?per_page=100&page=${page}`,
      { token: userToken },
    );

    installationIds.push(...installations.map((installation) => String(installation.id)));
    if (installations.length < 100) return installationIds;
  }
};

export const getGithubUserFromCode = async (code: string) => {
  const userToken = await exchangeOAuthCode(code);
  if (!userToken) return null;

  const { login, id } = await githubFetch<{ login: string; id: number }>("/user", {
    token: userToken,
  });

  return { login, id: String(id) };
};

export const getGithubLoginById = async (installationId: string, githubId: string) => {
  const { login } = await githubFetch<{ login: string }>(`/user/${githubId}`, {
    token: await getInstallationToken(installationId),
  });

  return login;
};

const CACHE_TTL = 5 * 60 * 1000;

const assignableCache = new Map<string, { value: boolean; expiresAt: number }>();

export const isGithubAssignable = async (installationId: string, repo: string, login: string) => {
  const key = `${repo}:${login.toLowerCase()}`;
  const cached = assignableCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetch(`${GITHUB_API}/repos/${repo}/assignees/${login}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${await getInstallationToken(installationId)}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  const value = response.status === 204;

  assignableCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
};

const existingLabels = new Map<string, number>();

export const ensureGithubLabels = async (
  installationId: string,
  repo: string,
  labels: { name: string; color: string }[],
) => {
  const token = await getInstallationToken(installationId);

  await Promise.all(
    labels.map(async ({ name, color }) => {
      const key = `${repo}:${name.toLowerCase()}`;
      if ((existingLabels.get(key) ?? 0) > Date.now()) return;

      const response = await fetch(`${GITHUB_API}/repos/${repo}/labels`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ name, color }),
        cache: "no-store",
      });

      if (!response.ok && response.status !== 422) {
        throw new Error(`GitHub POST /repos/${repo}/labels : ${response.status}`);
      }

      existingLabels.set(key, Date.now() + CACHE_TTL);
    }),
  );
};

export const getGithubIssueRepo = (issueUrl: string) => ISSUE_URL_PATTERN.exec(issueUrl)?.[1];

const milestones = new Map<string, { number: number; dueOn: string | null; expiresAt: number }>();

const toDay = (dueOn: string | null | undefined) => dueOn?.slice(0, 10) ?? null;

export const getGithubMilestone = async (
  installationId: string,
  repo: string,
  title: string,
  dueDay: string | null,
) => {
  const key = `${repo}:${title}`;
  const cached = milestones.get(key);
  if (cached && cached.expiresAt > Date.now() && cached.dueOn === dueDay) return cached.number;

  const token = await getInstallationToken(installationId);
  const due_on = dueDay ? `${dueDay}T12:00:00Z` : null;

  const findMilestone = async () => {
    for (let page = 1; ; page++) {
      const batch = await githubFetch<{ number: number; title: string; due_on: string | null }[]>(
        `/repos/${repo}/milestones?state=all&per_page=100&page=${page}`,
        { token },
      );

      const milestone = batch.find((candidate) => candidate.title === title);
      if (milestone || batch.length < 100) return milestone;
    }
  };

  let milestone = await findMilestone();

  if (!milestone) {
    try {
      milestone = await githubFetch<{ number: number; title: string; due_on: string | null }>(
        `/repos/${repo}/milestones`,
        { token, method: "POST", body: { title, due_on } },
      );
    } catch (error) {
      milestone = await findMilestone();
      if (!milestone) throw error;
    }
  }

  if (toDay(milestone.due_on) !== dueDay) {
    await githubFetch(`/repos/${repo}/milestones/${milestone.number}`, {
      token,
      method: "PATCH",
      body: { due_on },
    });
  }

  milestones.set(key, {
    number: milestone.number,
    dueOn: dueDay,
    expiresAt: Date.now() + CACHE_TTL,
  });
  return milestone.number;
};

const issuePath = (issueUrl: string) => {
  const match = ISSUE_URL_PATTERN.exec(issueUrl);
  return match ? `/repos/${match[1]}/issues/${match[2]}` : null;
};

export const editGithubIssueMetadata = async (
  installationId: string,
  issueUrl: string,
  {
    addLabels = [],
    removeLabels = [],
    addAssignees = [],
    removeAssignees = [],
  }: {
    addLabels?: string[];
    removeLabels?: string[];
    addAssignees?: string[];
    removeAssignees?: string[];
  },
) => {
  const path = issuePath(issueUrl);
  if (!path) return;

  const token = await getInstallationToken(installationId);

  await Promise.all([
    addLabels.length > 0 &&
      githubFetch(`${path}/labels`, { token, method: "POST", body: { labels: addLabels } }),
    ...removeLabels.map((name) =>
      githubFetch(`${path}/labels/${encodeURIComponent(name)}`, { token, method: "DELETE" }).catch(
        () => null,
      ),
    ),
    addAssignees.length > 0 &&
      githubFetch(`${path}/assignees`, {
        token,
        method: "POST",
        body: { assignees: addAssignees },
      }),
    removeAssignees.length > 0 &&
      githubFetch(`${path}/assignees`, {
        token,
        method: "DELETE",
        body: { assignees: removeAssignees },
      }),
  ]);
};

export interface GithubIssue {
  url: string;
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
  milestoneDueOn: string | null;
}

const ISSUES_IMPORT_LIMIT = 300;

export const listGithubOpenIssues = async (installationId: string, repo: string) => {
  const token = await getInstallationToken(installationId);
  const issues: GithubIssue[] = [];

  for (let page = 1; issues.length < ISSUES_IMPORT_LIMIT; page++) {
    const batch = await githubFetch<
      {
        html_url: string;
        title: string;
        body: string | null;
        pull_request?: unknown;
        user: { type: string } | null;
        labels: ({ name?: string } | string)[];
        assignees: { login: string }[] | null;
        milestone: { due_on: string | null } | null;
      }[]
    >(`/repos/${repo}/issues?state=open&per_page=100&page=${page}`, { token });

    issues.push(
      ...batch
        .filter((issue) => !issue.pull_request && issue.user?.type !== "Bot")
        .map((issue) => ({
          url: issue.html_url,
          title: issue.title,
          body: issue.body ?? "",
          labels: issue.labels
            .map((label) => (typeof label === "string" ? label : label.name))
            .filter((name): name is string => !!name),
          assignees: (issue.assignees ?? []).map((assignee) => assignee.login),
          milestoneDueOn: issue.milestone?.due_on ?? null,
        })),
    );
    if (batch.length < 100) break;
  }

  return issues.slice(0, ISSUES_IMPORT_LIMIT);
};

type IssueFields = {
  title?: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number | null;
};

export const createGithubIssue = async ({
  installationId,
  repo,
  state,
  ...fields
}: IssueFields & {
  installationId: string;
  repo: string;
  state: IssueState;
}) => {
  const token = await getInstallationToken(installationId);
  const issue = await githubFetch<{ html_url: string }>(`/repos/${repo}/issues`, {
    token,
    method: "POST",
    body: fields,
  });

  if (state === "closed") {
    await updateGithubIssue(installationId, issue.html_url, { state });
  }

  return issue.html_url;
};

export const updateGithubIssue = async (
  installationId: string,
  issueUrl: string,
  {
    state,
    stateReason,
    ...fields
  }: IssueFields & { state?: IssueState; stateReason?: "completed" | "not_planned" | "reopened" },
) => {
  const match = ISSUE_URL_PATTERN.exec(issueUrl);
  if (!match) return;

  const [, repo, number] = match;

  await githubFetch(`/repos/${repo}/issues/${number}`, {
    token: await getInstallationToken(installationId),
    method: "PATCH",
    body: {
      ...fields,
      ...(state && {
        state,
        state_reason: stateReason ?? (state === "closed" ? "completed" : "reopened"),
      }),
    },
  });
};

const githubGraphql = async <T>(
  installationId: string,
  query: string,
  variables: Record<string, unknown>,
) => {
  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getInstallationToken(installationId)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const { data, errors } = (await response.json()) as { data?: T; errors?: { message: string }[] };

  if (!response.ok || errors?.length || !data) {
    throw new Error(
      `GitHub GraphQL : ${response.status} ${errors?.map((error) => error.message).join(", ")}`,
    );
  }

  return data;
};

const parseIssueUrl = (issueUrl: string) => {
  const match = ISSUE_URL_PATTERN.exec(issueUrl);
  if (!match) throw new Error(`URL d'issue invalide : ${issueUrl}`);

  const [owner, name] = match[1].split("/");
  return { owner, name, number: Number(match[2]) };
};

export type GithubPullRequestState = "OPEN" | "CLOSED" | "MERGED";

export interface GithubDevelopment {
  branches: { name: string; url: string }[];
  pullRequests: {
    number: number;
    title: string;
    url: string;
    state: GithubPullRequestState;
    isDraft: boolean;
    reviewDecision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  }[];
}

export const getGithubDevelopment = async (
  installationId: string,
  issueUrl: string,
): Promise<GithubDevelopment> => {
  const { owner, name, number } = parseIssueUrl(issueUrl);

  const data = await githubGraphql<{
    repository: {
      url: string;
      issue: {
        linkedBranches: { nodes: { ref: { name: string } | null }[] };
        closedByPullRequestsReferences: { nodes: GithubDevelopment["pullRequests"] };
      } | null;
    };
  }>(
    installationId,
    `query ($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        url
        issue(number: $number) {
          linkedBranches(first: 10) { nodes { ref { name } } }
          closedByPullRequestsReferences(first: 10, includeClosedPrs: true) {
            nodes { number title url state isDraft reviewDecision }
          }
        }
      }
    }`,
    { owner, name, number },
  );

  const issue = data.repository.issue;

  return {
    branches: (issue?.linkedBranches.nodes ?? [])
      .map((node) => node.ref?.name)
      .filter((branch): branch is string => !!branch)
      .map((branch) => ({ name: branch, url: `${data.repository.url}/tree/${branch}` })),
    pullRequests: issue?.closedByPullRequestsReferences.nodes ?? [],
  };
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const createGithubLinkedBranch = async (
  installationId: string,
  issueUrl: string,
  title: string,
) => {
  const { owner, name, number } = parseIssueUrl(issueUrl);

  const { repository } = await githubGraphql<{
    repository: {
      id: string;
      defaultBranchRef: { target: { oid: string } } | null;
      issue: { id: string } | null;
    };
  }>(
    installationId,
    `query ($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        id
        defaultBranchRef { target { oid } }
        issue(number: $number) { id }
      }
    }`,
    { owner, name, number },
  );

  if (!repository.defaultBranchRef || !repository.issue) {
    throw new Error("Dépôt vide ou issue introuvable");
  }

  const branch = `${number}-${slugify(title)}`.slice(0, 60).replace(/-+$/, "");

  await githubGraphql(
    installationId,
    `mutation ($issueId: ID!, $oid: GitObjectID!, $name: String!, $repositoryId: ID!) {
      createLinkedBranch(input: { issueId: $issueId, oid: $oid, name: $name, repositoryId: $repositoryId }) {
        linkedBranch { id }
      }
    }`,
    {
      issueId: repository.issue.id,
      oid: repository.defaultBranchRef.target.oid,
      name: branch,
      repositoryId: repository.id,
    },
  );

  return branch;
};

export const createGithubComment = async (
  installationId: string,
  issueUrl: string,
  body: string,
) => {
  const path = issuePath(issueUrl);
  if (!path) return null;

  const { id } = await githubFetch<{ id: number }>(`${path}/comments`, {
    token: await getInstallationToken(installationId),
    method: "POST",
    body: { body },
  });

  return String(id);
};

export const updateGithubComment = async (
  installationId: string,
  issueUrl: string,
  commentId: string,
  body: string,
) => {
  const repo = getGithubIssueRepo(issueUrl);
  if (!repo) return;

  await githubFetch(`/repos/${repo}/issues/comments/${commentId}`, {
    token: await getInstallationToken(installationId),
    method: "PATCH",
    body: { body },
  });
};

export const deleteGithubComment = async (
  installationId: string,
  issueUrl: string,
  commentId: string,
) => {
  const repo = getGithubIssueRepo(issueUrl);
  if (!repo) return;

  await githubFetch(`/repos/${repo}/issues/comments/${commentId}`, {
    token: await getInstallationToken(installationId),
    method: "DELETE",
  });
};
