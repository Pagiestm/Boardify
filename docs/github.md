# GitHub App

Facultative : sans ses variables, l'intégration GitHub est masquée.

Chaque espace de travail peut connecter son compte ou son organisation GitHub via la GitHub App Boardify (_Paramètres de l'espace → GitHub_). Un projet est ensuite lié à un dépôt depuis ses paramètres : chaque nouvelle tâche crée une issue, mise à jour à chaque modification de la tâche, fermée quand elle passe dans une colonne terminée et rouverte quand elle en sort. Les issues sont signées par le bot de l'app.

## Synchronisation

- **Labels** : les étiquettes de la tâche et sa priorité (`priorité : haute`…), créés dans le dépôt s'ils n'existent pas. Les labels ajoutés depuis GitHub sont conservés.
- **Assigné** : le compte GitHub du membre (celui de son inscription via GitHub, ou celui lié depuis _Paramètres de l'espace → GitHub_), s'il a accès au dépôt.
- **Milestone** : une par projet Boardify, du même nom.
- **Description** : la description de la tâche, suivie de son statut et de sa période.
- **Depuis GitHub** (webhook) : fermer une issue, ou merger une PR qui la ferme, termine la tâche ; la rouvrir la ramène dans la première colonne non terminée ; modifier son titre ou sa description met à jour la tâche ; supprimer l'issue délie la tâche.
- **Développement** : la page d'une tâche affiche ses branches et pull requests liées, et permet de créer une branche liée à l'issue.
- **Import** : les paramètres du projet permettent de créer une tâche pour chaque issue ouverte du dépôt (hors issues créées par des bots).
- **Suppression** : supprimer une tâche (ou son projet) ferme son issue en « non planifiée ».

## Création de l'app

Une seule fois, dans _GitHub → Settings → Developer settings → GitHub Apps → New GitHub App_ :

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

Les attributs Appwrite correspondants (`githubInstallationId`, `githubRepo`, `githubIssueUrl`) sont décrits dans [`appwrite.md`](appwrite.md).
