# Tests end-to-end

[← Retour au README du projet](../README.md)

Suite Playwright qui pilote un vrai navigateur contre un vrai backend Appwrite.
Aucun mock : ce qui passe ici passe en production.

## Lancer

```bash
npm run test:e2e          # toute la suite
npm run test:e2e:ui       # mode interactif
npx playwright test --project=public   # sans identifiants
```

## Arborescence

```
e2e/
├── specs/        les tests, un fichier par domaine
│   ├── landing.public.spec.ts    pages publiques      (aucun prérequis)
│   ├── workspace.auth.spec.ts    espace de travail
│   ├── project.auth.spec.ts      projets
│   ├── task.auth.spec.ts         tâches et vues
│   ├── kanban.auth.spec.ts       glisser-déposer
│   └── deletion.auth.spec.ts     suppressions
├── helpers/      briques réutilisables, par domaine
│   ├── data.ts        marqueur et noms uniques
│   ├── forms.ts       Select Radix, sélecteur de date
│   ├── navigation.ts  accès workspace / tâches
│   ├── project.ts     création de projet
│   ├── task.ts        création de tâche
│   └── cleanup.ts     suppression des données de test
├── setup/
│   ├── auth.setup.ts        connexion, état de session partagé
│   └── cleanup.teardown.ts  nettoyage de fin de suite
└── .auth/        état de session (git-ignoré)
```

Le suffixe du fichier décide du projet Playwright qui l'exécute :
`*.public.spec.ts` sans identifiants, `*.auth.spec.ts` avec.

## Deux niveaux

| Projet          | Fichiers                 | Prérequis                     |
| --------------- | ------------------------ | ----------------------------- |
| `public`        | `specs/*.public.spec.ts` | aucun                         |
| `authenticated` | `specs/*.auth.spec.ts`   | `E2E_EMAIL` et `E2E_PASSWORD` |

Sans ces variables, le projet `authenticated` n'est pas monté du tout : la CI
reste verte sur les PR sans accès aux secrets, celles de Renovate notamment.

## Compte de test

Crée dans Appwrite un utilisateur **e-mail + mot de passe** dédié — les
parcours OAuth Google et GitHub ne sont pas automatisables, leurs écrans de
consentement appartiennent aux fournisseurs. Puis dans `.env.local` :

```
E2E_EMAIL=e2e@exemple.fr
E2E_PASSWORD=...
```

Le setup crée un espace de travail si le compte n'en a aucun : il fonctionne
donc sur un compte vierge.

## Nettoyage

Toutes les données créées portent le marqueur `[E2E]` en tête de leur nom
(`e2e/helpers/data.ts`). Le teardown supprime, via l'API de l'application :

- les tâches et projets marqués, dans tous les espaces du compte ;
- les espaces de travail marqués.

Ce marqueur est le seul garde-fou entre les tests et la base — **ne jamais
l'assouplir**. Une donnée réelle qui contiendrait « test » ou « E2E » ailleurs
que comme préfixe n'est pas touchée.

L'ordre de suppression est imposé par l'application : `DELETE /workspaces/:id`
ne supprime ni ses projets ni ses tâches, qui resteraient orphelins.

> Les tests écrivent dans la base visée par `.env.local`. Un projet Appwrite
> distinct de la production reste préférable.

## Écrire un test

```ts
import { test, expect } from "@playwright/test";
import { createProject, gotoWorkspace } from "../helpers";

test("mon parcours", async ({ page }) => {
  await gotoWorkspace(page); // session déjà ouverte
  const name = await createProject(page); // nom marqué et unique
  await expect(page.getByText(name).first()).toBeVisible();
});
```

Chaque spec crée ce dont elle a besoin : elles tournent en parallèle et ne
doivent dépendre ni l'une de l'autre, ni d'un run précédent.

## Régressions verrouillées

Deux défauts corrigés sont désormais tenus par des tests :

- `validation.auth.spec.ts` — `assigneeId` et `dueDate` étaient facultatifs
  dans `createtaskSchema` alors que la collection les exige : la création
  partait et l'API répondait 500. La validation bloque maintenant côté client.
- `cascade.auth.spec.ts` — supprimer un projet laissait ses tâches en base.

## Secrets GitHub

`Settings → Secrets and variables → Actions` : `E2E_EMAIL`, `E2E_PASSWORD` et
les `NEXT_PUBLIC_APPWRITE_*` du projet de test.
