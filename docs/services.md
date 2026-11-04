# Services interchangeables

Boardify tourne sur Appwrite, mais chacune de ses briques passe par une interface neutre et peut être remplacée par configuration, sans toucher aux routes :

| Brique     | Interface                                    | Par défaut        | Autre implémentation                                               | Variable                                |
| ---------- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------ | --------------------------------------- |
| Données    | `src/lib/db` (`db.tasks.list({ where })`…)   | Appwrite          | Postgres avec [Drizzle](https://orm.drizzle.team)                  | `DB_PROVIDER=postgres` + `DATABASE_URL` |
| Connexion  | `src/lib/auth` (`getAuth()`)                 | Appwrite Account  | [Better Auth](https://www.better-auth.com) (comptes dans Postgres) | `AUTH_PROVIDER=better-auth`             |
| Fichiers   | `src/lib/files` (`files.upload/read/delete`) | Appwrite Storage  | Tout stockage compatible S3 (Cloudflare R2, Scaleway, AWS…)        | `STORAGE_PROVIDER=s3` + `S3_*`          |
| Temps réel | `src/features/realtime/server`               | Appwrite Realtime | Postgres `LISTEN / NOTIFY`                                         | suit `DB_PROVIDER`                      |

Les briques se combinent librement. Avec Better Auth et des données ou fichiers restés sur Appwrite, la clé d'API Appwrite doit avoir les droits sur les bases de données et les fichiers (il n'y a plus de session Appwrite).

## Services locaux

```bash
docker compose up -d
```

| Service     | Adresse                                                    | Rôle                                                         |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Postgres 18 | `postgres://boardify:boardify@localhost:5434/boardify`     | Base de données                                              |
| pgAdmin     | http://localhost:5050                                      | Consultation de la base (serveur déjà configuré)             |
| Mailpit     | http://localhost:8026 (SMTP `localhost:1026`)              | E-mails envoyés en local (mot de passe oublié…)              |
| RustFS (S3) | API `http://localhost:9000`, console http://localhost:9001 | Fichiers, bucket `boardify` (`boardify` / `boardify-secret`) |

Toute l'application sans Appwrite, en local :

```bash
npm run db:migrate                           # crée les tables (données et comptes)
npm run db:import-appwrite -- --dry-run      # compte les documents et comptes Appwrite sans rien écrire
npm run db:import-appwrite                   # copie données et comptes en gardant les identifiants
npm run files:import-appwrite                # copie les fichiers vers S3 en gardant les identifiants
DB_PROVIDER=postgres AUTH_PROVIDER=better-auth STORAGE_PROVIDER=s3 npm run dev
```

Les imports lisent Appwrite sans jamais y écrire et peuvent être relancés (les lignes existantes sont mises à jour, les fichiers déjà copiés ignorés). Les mots de passe Appwrite (Argon2) restent valables avec Better Auth ; les sessions ne sont pas copiées, chacun se reconnecte une fois.

- **Schéma** : `src/lib/db/schema.ts` ; après une modification (nouveau champ dans une collection Appwrite, par exemple), `npm run db:generate` crée la migration SQL dans `drizzle/`.
- **Connexion** : avec Better Auth, Google et GitHub demandent leurs propres applications OAuth (`GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`, adresse de retour `<app>/api/better-auth/callback/<google|github>`) et le mot de passe oublié envoie un e-mail (modèle MJML dans `src/lib/email/templates`) via `SMTP_URL`. L'application desktop garde le même fonctionnement (jeton à usage unique).
- **Fichiers** : avec S3, seul le serveur accède aux fichiers ; les droits sont vérifiés par les routes. La copie depuis Appwrite demande le droit `files.read` sur la clé d'API. Les icônes d'espace et de projet sont enregistrées avec l'élément (adresse `data:`) et n'ont rien à copier.
- **Temps réel** : avec Postgres, chaque écriture est annoncée sur le canal `boardify_changes` (identifiants seulement) et `/api/realtime` la relaie au navigateur. L'écoute demande une connexion directe : si `DATABASE_URL` passe par un pooler en mode transaction (Neon `-pooler`, PgBouncer, Supabase port 6543), renseignez `DATABASE_DIRECT_URL`.

## Commandes

| Commande                        | Description                                         |
| ------------------------------- | --------------------------------------------------- |
| `npm run db:migrate`            | Applique les migrations à `DATABASE_URL`            |
| `npm run db:generate`           | Crée une migration SQL à partir du schéma Drizzle   |
| `npm run db:studio`             | Explorateur Drizzle Studio                          |
| `npm run db:import-appwrite`    | Copie les données et comptes Appwrite dans Postgres |
| `npm run files:import-appwrite` | Copie les fichiers Appwrite vers le stockage S3     |
