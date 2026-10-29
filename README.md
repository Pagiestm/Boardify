<p align="center">
  <img src="public/logo.svg" width="64" height="64" alt="Boardify" />
</p>

<h1 align="center">Boardify</h1>

<p align="center">Gestion de projets simple pour les équipes : espaces de travail, projets et tâches en Kanban, tableau, calendrier ou frise, synchronisés avec GitHub. Sur le web et en application desktop.</p>

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) · React 19 · TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) · composants [shadcn/ui](https://ui.shadcn.com) · [Motion](https://motion.dev) · [cmdk](https://cmdk.paco.me) (palette ⌘K)
- [Hono](https://hono.dev) pour l'API (`src/app/api/[[...route]]`) · [TanStack Query](https://tanstack.com/query) / [TanStack Table](https://tanstack.com/table)
- [Appwrite](https://appwrite.io) (auth, base de données, stockage)
- [Tauri 2](https://tauri.app) pour l'application desktop (`src-tauri/`)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Toutes les valeurs se trouvent dans la console Appwrite :

| Variable                                                                                                                                                                                                                                                                   | Où la trouver                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                                                                                                                                                                                                                                                      | `http://localhost:3000` en local                                         |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`                                                                                                                                                                                                                                            | _Settings_ du projet → API Endpoint (se termine par `/v1`)               |
| `NEXT_PUBLIC_APPWRITE_PROJECT`                                                                                                                                                                                                                                             | _Settings_ du projet → Project ID                                        |
| `NEXT_APPWRITE_KEY`                                                                                                                                                                                                                                                        | _Overview → Integrations → API Keys_ (scopes auth, databases, storage)   |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID`                                                                                                                                                                                                                                         | _Databases_ → ID de la base                                              |
| `NEXT_PUBLIC_APPWRITE_WORKSPACES_ID` / `MEMBERS_ID` / `PROJECTS_ID` / `TASKS_ID` / `LABELS_ID` / `COMMENTS_ID` / `ACTIVITIES_ID` / `NOTIFICATIONS_ID` / `CHECKLIST_ITEMS_ID` / `ATTACHMENTS_ID` / `TASK_TEMPLATES_ID` / `SAVED_VIEWS_ID` / `SPRINTS_ID` / `AI_SETTINGS_ID` | ID de chaque collection                                                  |
| `CRON_SECRET`                                                                                                                                                                                                                                                              | Secret des tâches planifiées Vercel (notification « échéance demain »)   |
| `AI_ENCRYPTION_KEY`                                                                                                                                                                                                                                                        | Chiffrement des clés d'API de l'assistant IA (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID`                                                                                                                                                                                                                                    | _Storage_ → ID du bucket d'images                                        |

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
| Subscribe to events                                    | Issues, Issue comment                                                                       |
| Repository permissions                                 | Issues : Read and write, Contents : Read and write, Pull requests : Read-only               |
| Where can this GitHub App be installed?                | Any account                                                                                 |

Renseignez ensuite `GITHUB_APP_SLUG` (fin de l'URL publique de l'app), `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY` (contenu du `.pem` généré) et `GITHUB_APP_WEBHOOK_SECRET`. La clé API Appwrite doit avoir les scopes `documents.read` et `documents.write`, utilisés par le webhook. Sans ces variables, la fonctionnalité est masquée.

Dans Appwrite, ajoutez les attributs optionnels `githubInstallationId` (string, 32) aux espaces de travail, `githubRepo` (string, 140) aux projets et `githubIssueUrl` (URL) aux tâches.

## Collaboration

- **Commentaires** sur chaque tâche, avec mentions `@membre` (stockées sous la forme `@[Nom](id)`). Sur une tâche liée à une issue, ils sont publiés sur l'issue par le bot de l'app ; les commentaires écrits sur GitHub remontent dans la tâche (webhook `issue_comment`).
- **Activité** : chaque modification d'une tâche (statut, assigné, priorité, période, nom, description, étiquettes, projet) et chaque action faite sur l'issue GitHub est enregistrée et affichée avec les commentaires, dans l'ordre chronologique.
- **Notifications** : assignation, mention, commentaire sur une tâche assignée et échéance du lendemain, dans la cloche de la barre supérieure, et dans l'application desktop en notification native avec une pastille sur l'icône du Dock. L'échéance est vérifiée chaque matin par une tâche planifiée Vercel (`vercel.json`, route `/api/cron/due-soon` protégée par `CRON_SECRET`).
- **Mise à jour automatique** : les tâches, commentaires et l'activité se rafraîchissent toutes les 5 secondes tant que l'onglet est visible, en passant par l'API de Boardify et ses contrôles d'accès.

Collections Appwrite (permissions « All users » : Create, Read, Update, Delete, comme les tâches) :

| Collection      | Attributs                                                                                                               | Index    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| `comments`      | `workspaceId`, `taskId`, `memberId` (string 50, requis), `content` (string 5000, requis), `githubCommentId` (string 50) | `taskId` |
| `activities`    | `workspaceId`, `taskId`, `type` (string 50, requis), `memberId` (string 50), `data` (string 2000)                       | `taskId` |
| `notifications` | `workspaceId`, `userId`, `taskId`, `type` (string 50, requis), `actorId` (string 50), `read` (boolean, défaut `false`)  | `userId` |

## Tâches enrichies

- **Sous-tâches** : une checklist par tâche, avec sa progression sur la page de la tâche et sur la carte Kanban.
- **Dépendances** : une tâche peut être « bloquée par » d'autres tâches de l'espace. Les boucles sont refusées. Les cartes bloquées sont signalées et la Frise relie les tâches par des flèches.
- **Pièces jointes** : jusqu'à 10 Mo par fichier, stockées dans le bucket d'images et servies par l'API (aperçu pour les images et les PDF, téléchargement pour le reste).
- **Tâches récurrentes** : chaque jour, semaine ou mois. Quand la tâche passe dans une colonne terminée (depuis Boardify ou en fermant l'issue GitHub), l'occurrence suivante est créée avec ses dates décalées et sa checklist remise à zéro.
- **Modèles** : une tâche peut être enregistrée comme modèle (description, priorité, étiquettes, répétition, sous-tâches) puis réutilisée à la création. Les administrateurs les gèrent dans les paramètres de l'espace.
- **Vues sauvegardées** : chaque membre enregistre ses combinaisons de filtres et de vue (tableau, Kanban, calendrier, frise).

Attributs optionnels à ajouter aux tâches : `blockedBy` (string 50, tableau) et `recurrence` (string 20). Collections (mêmes permissions que les tâches) :

| Collection        | Attributs                                                                                                                                 | Index         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `checklist_items` | `workspaceId`, `taskId` (string 50, requis), `title` (string 500, requis), `done` (boolean, défaut `false`), `position` (integer, requis) | `taskId`      |
| `attachments`     | `workspaceId`, `taskId`, `memberId`, `fileId` (string 50, requis), `name` (string 255, requis), `mimeType` (string 100), `size` (integer) | `taskId`      |
| `task_templates`  | `workspaceId` (string 50, requis), `name` (string 100, requis), `data` (string 5000, requis)                                              | `workspaceId` |
| `saved_views`     | `workspaceId`, `memberId` (string 50, requis), `name` (string 100, requis), `view` (string 20, requis), `filters` (string 2000, requis)   | `workspaceId` |

Le bucket d'images doit accepter tous les types de fichiers, jusqu'à 10 Mo, avec les permissions « All users » : Create, Read, Delete.

## Planification

- **Sprints** : chaque projet peut être découpé en sprints (période, objectif). La barre de sprint de la page projet filtre toutes les vues, affiche l'avancement en tâches et en points, et la charge restante de chaque membre. Terminer un sprint reporte ses tâches non terminées vers un autre sprint ou le backlog.
- **Estimation** : chaque tâche peut recevoir des points, utilisés par les sprints et la charge.
- **Charge des prochaines semaines** : sur l'accueil, le travail restant de chaque membre est réparti sur les jours ouvrés jusqu'à l'échéance, semaine par semaine, en points ou en nombre de tâches.
- **Abonnement iCal** : depuis la vue Calendrier, chaque membre génère un lien personnel vers ses tâches assignées (Apple Calendar, Google Agenda, Outlook). Le lien est signé côté serveur et peut être régénéré ou désactivé à tout moment.

Attributs optionnels : `sprintId` (string 50, indexé) et `estimate` (integer 0–1000) sur les tâches, `calendarToken` (string 64) sur les membres. Collection :

| Collection | Attributs                                                                                                                                                           | Index       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `sprints`  | `workspaceId`, `projectId` (string 50, requis), `name` (string 100, requis), `goal` (string 1000), `startDate`, `endDate` (datetime, requis), `completed` (boolean) | `projectId` |

## Assistant IA

Chaque espace branche **sa propre IA** : dans les paramètres de l'espace, un administrateur choisit le fournisseur (OpenAI, Anthropic, Mistral, Google Gemini ou un service compatible OpenAI : OpenRouter, Groq…), le modèle et colle sa clé d'API. Les appels sont facturés par ce fournisseur ; Boardify n'utilise aucune IA à ses frais.

- **Nouvelle tâche** : « Compléter avec l'IA » propose, à partir du nom, la description, les sous-tâches, la priorité et l'estimation.
- **Ajout rapide** (⌃⌥N, application desktop) : « Interpréter » (⌘I) transforme « Appeler le client vendredi, urgent #commercial » en titre, échéance, priorité, projet, assigné et étiquettes.
- **Description** : « Rédiger avec l'IA » sur une tâche rédige ou améliore la description, en direct, avec une consigne facultative et un bouton « Arrêter ».
- **Sous-tâches** : « Suggérer » propose un découpage à cocher avant de l'ajouter à la checklist.
- **Discussion** : « Résumer la discussion » (décisions, questions ouvertes, prochaines actions) et « Suggérer une réponse » dans le champ de commentaire.
- **Ma journée** : sur l'accueil, les tâches à traiter en priorité aujourd'hui, avec une raison pour chacune.
- **Recherche en langage naturel** : dans ⌘K, « Demander à l'IA » traduit une question (« mes tâches en retard du projet X ») en critères appliqués côté serveur.
- **Menu « Assistant » d'un projet** : point d'avancement (projet ou sprint sélectionné), bilan des 7, 14 ou 30 derniers jours, notes de version, création de tâches depuis un texte (compte rendu, e-mail) et estimation en masse des tâches sans estimation.
- **Planifier un sprint** : depuis la barre de sprint, l'assistant propose les tâches du backlog à ajouter selon l'objectif, les échéances et la charge de chacun.

Chaque appel est limité dans le temps (60 s, 120 s pour les textes en flux) ; interrompre un texte en flux coupe aussi la génération chez le fournisseur. La liste des modèles est lue chez le fournisseur avec la clé de l'espace.

La clé est chiffrée en AES-256-GCM avec `AI_ENCRYPTION_KEY` avant d'être stockée, et n'est jamais renvoyée au navigateur. La collection n'a **aucune permission** : seul le serveur y accède, avec la clé admin. Les appels passent par l'[AI SDK](https://ai-sdk.dev) ([`src/features/assistant`](src/features/assistant)).

| Collection    | Attributs                                                                                                                                                                                                                                                                                                  | Index                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `ai_settings` | `workspaceId` (string 50, requis), `provider` (enum `openai`, `anthropic`, `mistral`, `google`, `openai-compatible`, requis), `model` (string 100, requis), `baseUrl` (string 500), `apiKeyEncrypted` (string 2000, requis), `apiKeyHint` (string 8), `enabled` (boolean, `true`), `updatedBy` (string 50) | `workspaceId` (unique) |

## Application desktop

Boardify est disponible en application desktop pour macOS, Windows et Linux, construite avec [Tauri 2](https://tauri.app) (dossier `src-tauri/`). Les installateurs sont proposés sur la page [`/download`](src/app/download/page.tsx).

### Architecture

L'application est une coquille native qui affiche la version hébergée de Boardify dans le moteur web du système : WebKit sur macOS, WebView2 sur Windows, WebKitGTK sur Linux. L'interface, l'API et la session sont celles du site. L'application ne contient ni code métier ni secret, et reflète chaque déploiement sans mise à jour. Seules les fonctions natives (barre des menus, raccourci global, pastille) passent par une nouvelle version, installée par la mise à jour automatique.

```mermaid
flowchart LR
    subgraph Poste["Poste de l'utilisateur"]
        subgraph App["Application Boardify"]
            Shell["Coquille Tauri (Rust)<br/>fenêtres, navigation, liens boardify://<br/>barre des menus, raccourci, mises à jour"]
            WebView["Moteur web du système<br/>WebKit · WebView2 · WebKitGTK"]
            Shell --> WebView
        end
        Browser["Navigateur"]
    end
    Next["Boardify (Next.js)<br/>pages et API"]
    Appwrite[("Appwrite")]
    GitHub["GitHub"]

    WebView -- HTTPS --> Next
    Browser -- HTTPS --> Next
    Next --> Appwrite
    Next --> GitHub
    Shell -. liens externes .-> Browser
    Shell -. latest.json .-> GitHub
```

### Fonctionnalités natives

| Fonction                  | Détail                                                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ajout rapide              | `⌃⌥N` (Ctrl+Alt+N sous Windows et Linux), depuis n'importe quelle application : petite fenêtre [`/quick-add`](src/app/quick-add/page.tsx) sur l'écran de la souris, fermée par Échap ou en cliquant ailleurs |
| Barre des menus           | Ouvrir Boardify, nouvelle tâche, tâches du jour et en retard de l'espace courant, mises à jour, quitter. Fermer la fenêtre la masque, l'icône du Dock la rouvre                                              |
| Pastille                  | Nombre de notifications non lues sur l'icône du Dock (macOS) ou du lanceur (Linux), non gérée par Windows                                                                                                    |
| Mises à jour automatiques | Vérification au lancement puis toutes les 6 h, et depuis le menu : l'application propose d'installer la nouvelle version puis redémarre                                                                      |

La page transmet les notifications non lues et les tâches du jour par la commande `sync_desktop_state` ([`desktop-bridge.tsx`](src/features/desktop/components/desktop-bridge.tsx)), autorisée uniquement pour la fenêtre principale et les adresses de Boardify ([`capabilities/desktop-state.json`](src-tauri/capabilities/desktop-state.json)). La fenêtre d'ajout rapide n'a accès à aucune commande : ses adresses `/quick-add/close` et `/quick-add/open?to=…` sont interceptées par la coquille.

### Comportement

| Situation                                | Comportement                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| Lancement                                | Ouvre `/dashboard` (redirige vers la connexion si nécessaire)              |
| Navigation vers Boardify ou `github.com` | Dans la fenêtre (installation de la GitHub App, liaison de compte)         |
| Navigation vers un autre domaine         | Dans le navigateur par défaut                                              |
| Lien `target="_blank"` ou `window.open`  | Dans le navigateur par défaut                                              |
| Lien `boardify://`                       | Transmis à l'instance en cours (ou la lance)                               |
| Chargement d'une page                    | Cookie `boardify-desktop=1`, qui identifie l'application auprès du serveur |
| Fermeture de la fenêtre                  | Masque la fenêtre, l'application reste dans la barre des menus             |
| Clic sur l'icône du Dock                 | Rouvre la fenêtre                                                          |

### Structure

| Fichier                                            | Rôle                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`src/main.rs`](src-tauri/src/main.rs)             | Fenêtre principale, adresse chargée, règles de navigation, liens `boardify://`     |
| [`src/quick_add.rs`](src-tauri/src/quick_add.rs)   | Raccourci global et fenêtre d'ajout rapide                                         |
| [`src/tray.rs`](src-tauri/src/tray.rs)             | Icône et menu de la barre des menus, pastille, commande `sync_desktop_state`       |
| [`src/updater.rs`](src-tauri/src/updater.rs)       | Vérification et installation des mises à jour                                      |
| [`src/init.js`](src-tauri/src/init.js)             | Script injecté dans chaque page                                                    |
| [`capabilities/`](src-tauri/capabilities)          | Commandes autorisées pour la page : notifications natives, `sync_desktop_state`    |
| [`tauri.conf.json`](src-tauri/tauri.conf.json)     | Identité de l'application, version (lue dans `package.json`), icônes, schéma d'URL |
| [`Cargo.toml`](src-tauri/Cargo.toml)               | Dépendances : Tauri et ses plugins                                                 |
| [`app-icon.svg`](src-tauri/app-icon.svg), `icons/` | Icône source, icônes générées, icône monochrome de la barre des menus              |

### Connexion Google et GitHub

Les fournisseurs OAuth n'acceptent pas les fenêtres intégrées : la connexion s'effectue dans le navigateur et revient dans l'application par le schéma `boardify://`.

1. [`src/lib/oauth.ts`](src/lib/oauth.ts) détecte le cookie `boardify-desktop` et définit `/oauth/desktop` comme URL de retour d'Appwrite.
2. L'application ouvre la page de connexion dans le navigateur.
3. [`/oauth/desktop`](src/app/oauth/desktop/page.tsx) transmet le jeton à usage unique d'Appwrite à l'application : `boardify://oauth?userId=…&secret=…`.
4. L'application charge `/oauth` avec ce jeton, qui crée la session dans sa fenêtre.

La connexion par e-mail se fait directement dans l'application. Le cookie de session n'est `Secure` qu'en HTTPS, WebKit le refusant sur `http://localhost`.

### Développement

Prérequis : [Rust](https://rustup.rs) (stable).

```bash
npm run dev            # site, sur http://localhost:3000
npm run desktop:dev    # application, sur http://localhost:3000
npm run desktop:build  # installateurs, sur la version hébergée
```

- `desktop:build` signe les mises à jour : il attend la clé privée dans `TAURI_SIGNING_PRIVATE_KEY` (contenu ou chemin du fichier) et son mot de passe dans `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

- `BOARDIFY_URL`, lue à la compilation, remplace l'adresse chargée (`http://localhost:3000` en développement, la version hébergée en production).
- Sur macOS, le schéma `boardify://` n'est enregistré que par une application empaquetée : `npx tauri build --debug --bundles app`, puis ouvrir `src-tauri/target/debug/bundle/macos/Boardify.app`.
- Icônes : exporter `src-tauri/app-icon.svg` en PNG 1024 px, puis `npx tauri icon <png> -o src-tauri/icons`.

### Publication

À chaque release, [`release.yml`](.github/workflows/release.yml) appelle [`desktop.yml`](.github/workflows/desktop.yml), qui compile l'application et ajoute ses installateurs à la release GitHub :

| Système               | Installateurs               |
| --------------------- | --------------------------- |
| macOS (Apple Silicon) | `.dmg`                      |
| macOS (Intel)         | `.dmg`                      |
| Windows               | `.exe`, `.msi`              |
| Linux                 | `.AppImage`, `.deb`, `.rpm` |

Les bundles de mise à jour (`.app.tar.gz`, installateur NSIS, AppImage) sont signés avec la clé des secrets `TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, dont la clé publique figure dans `tauri.conf.json`. Une fois tous les builds terminés, le job `updater` assemble le manifeste `latest.json` ([`scripts/updater-manifest.mjs`](scripts/updater-manifest.mjs)) et l'ajoute à la release : c'est lui que les applications installées consultent. Perdre la clé privée empêche toute mise à jour des applications déjà installées.

`desktop.yml` peut aussi être lancé manuellement depuis l'onglet _Actions_ pour un tag existant. La page `/download` affiche la dernière release qui contient des installateurs (cache d'une heure).

Les applications ne sont pas signées : macOS et Windows affichent un avertissement au premier lancement, documenté sur `/download`.

## Scripts

| Commande                | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Serveur de développement                   |
| `npm run build`         | Build de production                        |
| `npm run start`         | Lance le build de production               |
| `npm run lint`          | ESLint                                     |
| `npm run format`        | Formate le projet avec Prettier            |
| `npm run format:check`  | Vérifie le formatage (utilisé par la CI)   |
| `npm run release`       | Lance semantic-release (utilisé par la CI) |
| `npm run desktop:dev`   | Application desktop en développement       |
| `npm run desktop:build` | Installateurs de l'application desktop     |

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

À chaque push sur `master`, la CI analyse les commits depuis la dernière release et, si nécessaire, publie une nouvelle version : tag Git, release GitHub (avec les installateurs de l'application desktop), `CHANGELOG.md` et `package.json` mis à jour. La version courante est affichée dans l'application (pied de page, barre latérale, pages de connexion).

Les messages de commit doivent suivre les [Conventional Commits](https://www.conventionalcommits.org/fr) :

| Commit                                         | Effet                          |
| ---------------------------------------------- | ------------------------------ |
| `fix: …`                                       | version corrective (1.0.**1**) |
| `feat: …`                                      | version mineure (1.**1**.0)    |
| `feat!: …` ou `BREAKING CHANGE:` dans le corps | version majeure (**2**.0.0)    |
| `chore:`, `docs:`, `refactor:`, `style:`…      | pas de nouvelle version        |
