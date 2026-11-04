<p align="center">
  <img src="public/logo.svg" width="64" height="64" alt="Boardify" />
</p>

<h1 align="center">Boardify</h1>

<p align="center">
  Gestion de projets pour les équipes, sur le web et en application desktop.
</p>

<p align="center">
  <a href="https://boardify.theotimepagies.com">Site</a> ·
  <a href="https://boardify.theotimepagies.com/download">Télécharger</a> ·
  <a href="https://boardify.theotimepagies.com/guide">Guide</a> ·
  <a href="CHANGELOG.md">Nouveautés</a>
</p>

<p align="center">
  <a href="https://github.com/Pagiestm/Boardify/actions/workflows/ci.yml"><img src="https://github.com/Pagiestm/Boardify/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/Pagiestm/Boardify/releases/latest"><img src="https://img.shields.io/github/v/release/Pagiestm/Boardify" alt="Version" /></a>
</p>

## Fonctionnalités

- **Tâches** : Kanban, tableau, calendrier et frise ; sous-tâches, dépendances, pièces jointes, récurrence, modèles, descriptions Markdown, actions groupées.
- **Planification** : sprints avec burndown et vélocité, rétrospectives, planning poker, suivi du temps, charge de l'équipe.
- **Collaboration** : commentaires et mentions, notifications et rappels, temps réel et présence, documentation par projet, formulaire public de demande.
- **Pilotage** : portefeuille de projets, indicateurs de flux (temps de cycle, débit, flux cumulé).
- **Intégrations** : synchronisation avec les issues GitHub, abonnement iCal, assistant IA avec la clé de chaque espace.
- **Application desktop** (macOS, Windows, Linux) : ajout rapide global, barre des menus, mises à jour automatiques.

Le [guide intégré](https://boardify.theotimepagies.com/guide) détaille chaque fonctionnalité.

## Stack

[Next.js 16](https://nextjs.org) · React 19 · TypeScript · [Tailwind CSS 4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Hono](https://hono.dev) · [TanStack Query](https://tanstack.com/query) · [Appwrite](https://appwrite.io) · [Tauri 2](https://tauri.app)

Les données, la connexion, les fichiers et le temps réel passent par des interfaces neutres : Appwrite peut être remplacé par Postgres, Better Auth et un stockage S3 ([détails](docs/services.md)).

## Démarrage

Prérequis : Node.js 26 et un projet [Appwrite](https://appwrite.io).

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:3000
```

Les variables sont décrites dans [`.env.example`](.env.example), et les collections Appwrite à créer dans [`docs/appwrite.md`](docs/appwrite.md).

## Scripts

| Commande                | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Serveur de développement                          |
| `npm run build`         | Build de production                               |
| `npm test`              | Tests unitaires (Vitest)                          |
| `npm run lint`          | ESLint                                            |
| `npm run format`        | Formatage (Prettier)                              |
| `npm run desktop:dev`   | Application desktop en développement              |
| `npm run desktop:build` | Installateurs de l'application desktop            |
| `npm run db:*`          | Base Postgres (voir [services](docs/services.md)) |

## Documentation

| Document                               | Contenu                                                     |
| -------------------------------------- | ----------------------------------------------------------- |
| [`docs/appwrite.md`](docs/appwrite.md) | Collections, attributs, index et permissions                |
| [`docs/github.md`](docs/github.md)     | Création et configuration de la GitHub App                  |
| [`docs/desktop.md`](docs/desktop.md)   | Architecture, développement et publication de l'application |
| [`docs/services.md`](docs/services.md) | Postgres, Better Auth, S3 et services locaux (Docker)       |

## Contribuer

Les messages de commit suivent les [Conventional Commits](https://www.conventionalcommits.org/fr) : ils déterminent la version publiée par [semantic-release](https://semantic-release.gitbook.io) à chaque push sur `master` (`fix:` corrective, `feat:` mineure, `feat!:` majeure). Chaque pull request passe par la CI : formatage, lint, tests et build.
