<p align="center">
  <img src="public/logo.svg" width="64" height="64" alt="Boardify" />
</p>

<h1 align="center">Boardify</h1>

<p align="center">Gestion de projets simple pour les équipes : espaces de travail, projets et tâches en Kanban, tableau ou calendrier.</p>

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) · React 19 · TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) · composants [shadcn/ui](https://ui.shadcn.com) · [Motion](https://motion.dev) · [cmdk](https://cmdk.paco.me) (palette ⌘K)
- [Hono](https://hono.dev) pour l'API (`src/app/api/[[...route]]`) · [TanStack Query](https://tanstack.com/query) / [TanStack Table](https://tanstack.com/table)
- [Appwrite](https://appwrite.io) (auth, base de données, stockage)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Toutes les valeurs se trouvent dans la console Appwrite :

| Variable                                                                                       | Où la trouver                                                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                                                          | `http://localhost:3000` en local                                       |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`                                                                | _Settings_ du projet → API Endpoint (se termine par `/v1`)             |
| `NEXT_PUBLIC_APPWRITE_PROJECT`                                                                 | _Settings_ du projet → Project ID                                      |
| `NEXT_APPWRITE_KEY`                                                                            | _Overview → Integrations → API Keys_ (scopes auth, databases, storage) |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID`                                                             | _Databases_ → ID de la base                                            |
| `NEXT_PUBLIC_APPWRITE_WORKSPACES_ID` / `MEMBERS_ID` / `PROJECTS_ID` / `TASKS_ID` / `LABELS_ID` | ID de chaque collection                                                |
| `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID`                                                        | _Storage_ → ID du bucket d'images                                      |

Pour la connexion Google / GitHub, activez les providers dans _Auth → Settings_ et ajoutez une plateforme Web `localhost` dans le projet Appwrite.

### Issues GitHub (optionnel)

Chaque espace de travail peut connecter son compte ou son organisation GitHub via la GitHub App Boardify (_Paramètres de l'espace → GitHub_). Un projet est ensuite lié à un dépôt depuis ses paramètres : chaque nouvelle tâche crée une issue, mise à jour à chaque modification de la tâche, fermée quand elle passe dans une colonne terminée et rouverte quand elle en sort. Les issues sont signées par le bot de l'app.

- **Labels** : les étiquettes de la tâche et sa priorité (`priorité : haute`…), créés dans le dépôt s'ils n'existent pas. Les labels ajoutés depuis GitHub sont conservés.
- **Assigné** : le compte GitHub du membre (celui de son inscription via GitHub, ou celui lié depuis _Paramètres de l'espace → GitHub_), s'il a accès au dépôt.
- **Milestone** : une par projet Boardify, du même nom.
- **Description** : la description de la tâche, suivie de son statut et de sa période.
- **Depuis GitHub** (webhook) : fermer une issue, ou merger une PR qui la ferme, termine la tâche ; la rouvrir la ramène dans la première colonne non terminée ; modifier son titre ou sa description met à jour la tâche ; supprimer l'issue délie la tâche.
- **Développement** : la page d'une tâche affiche ses branches et pull requests liées, et permet de créer une branche liée à l'issue.
- **Import** : les paramètres du projet permettent de créer une tâche pour chaque issue ouverte du dépôt (hors issues créées par des bots).
- **Suppression** : supprimer une tâche (ou son projet) ferme son issue en « non planifiée ».

Création de l'app (une seule fois), dans _GitHub → Settings → Developer settings → GitHub Apps → New GitHub App_ :

| Champ                                                  | Valeur                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Callback URL                                           | `<NEXT_PUBLIC_APP_URL>/github/callback`                                                     |
| Request user authorization (OAuth) during installation | coché (sert à vérifier que l'installation est la vôtre)                                     |
| Post installation → Redirect on update                 | coché (utile pour lier un 2ᵉ espace de travail)                                             |
| Webhook → Active                                       | coché, URL `<NEXT_PUBLIC_APP_URL>/api/github/webhook` et secret `GITHUB_APP_WEBHOOK_SECRET` |
| Subscribe to events                                    | Issues                                                                                      |
| Repository permissions                                 | Issues : Read and write, Contents : Read and write, Pull requests : Read-only               |
| Where can this GitHub App be installed?                | Any account                                                                                 |

Renseignez ensuite `GITHUB_APP_SLUG` (fin de l'URL publique de l'app), `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY` (contenu du `.pem` généré) et `GITHUB_APP_WEBHOOK_SECRET`. La clé API Appwrite doit avoir les scopes `documents.read` et `documents.write`, utilisés par le webhook. Sans ces variables, la fonctionnalité est masquée.

Dans Appwrite, ajoutez les attributs optionnels `githubInstallationId` (string, 32) aux espaces de travail, `githubRepo` (string, 140) aux projets et `githubIssueUrl` (URL) aux tâches.

## Scripts

| Commande               | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Serveur de développement                   |
| `npm run build`        | Build de production                        |
| `npm run start`        | Lance le build de production               |
| `npm run lint`         | ESLint                                     |
| `npm run format`       | Formate le projet avec Prettier            |
| `npm run format:check` | Vérifie le formatage (utilisé par la CI)   |
| `npm run release`      | Lance semantic-release (utilisé par la CI) |

## Qualité et CI

Chaque pull request déclenche [`ci.yml`](.github/workflows/ci.yml) :
formatage, lint et build.

- **Prettier** (`.prettierrc.json`) formate le code, classes Tailwind comprises
- **ESLint** (`eslint.config.mjs`) sur la configuration Next.js
- **commitlint** + **husky** vérifient chaque message de commit, et
  **lint-staged** formate les fichiers mis en scène avant chaque commit
- **Renovate** (`renovate.json`) ouvre les mises à jour de dépendances et
  fusionne les correctifs dont la CI est verte

## Versions et releases

Les versions sont gérées automatiquement par [semantic-release](https://semantic-release.gitbook.io) (config : `.releaserc.json`, workflow : `.github/workflows/release.yml`).

À chaque push sur `master`, la CI analyse les commits depuis la dernière release et, si nécessaire, publie une nouvelle version : tag Git, release GitHub, `CHANGELOG.md` et `package.json` mis à jour. La version courante est affichée dans l'application (pied de page, barre latérale, pages de connexion).

Les messages de commit doivent suivre les [Conventional Commits](https://www.conventionalcommits.org/fr) :

| Commit                                         | Effet                          |
| ---------------------------------------------- | ------------------------------ |
| `fix: …`                                       | version corrective (1.0.**1**) |
| `feat: …`                                      | version mineure (1.**1**.0)    |
| `feat!: …` ou `BREAKING CHANGE:` dans le corps | version majeure (**2**.0.0)    |
| `chore:`, `docs:`, `refactor:`, `style:`…      | pas de nouvelle version        |
