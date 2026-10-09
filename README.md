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
