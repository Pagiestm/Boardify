import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  createIsolatedWorkspace,
  createProject,
  createTask,
  gotoIsolatedTasks,
  gotoProjectKanban,
  pickToday,
  selectFirstOption,
  selectOptionByName,
  uniqueName,
} from "../helpers";

const openProject = async (page: Page, request: APIRequestContext) => {
  const workspaceId = await createIsolatedWorkspace(request);
  await page.goto(`/workspaces/${workspaceId}`);
  await createProject(page);
  const projectUrl = page.url();

  return { workspaceId, projectUrl };
};

const expectColumns = async (page: Page, names: string[]) => {
  await expect
    .poll(async () => page.getByRole("heading", { level: 2 }).allInnerTexts(), {
      timeout: 30_000,
    })
    .toEqual(names);
};

const gotoKanban = async (page: Page, url: string) => {
  await page.goto(`${url}?task-view=kanban`);
  await expect(page.getByRole("tab", { name: "Kanban" })).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible({ timeout: 30_000 });
};

test.describe("Colonnes du tableau", () => {
  test("on renomme une colonne depuis le tableau", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    await page.getByRole("button", { name: "Personnaliser le statut Backlog" }).click();
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    await page.getByLabel("Renommer le statut Backlog").fill("Idées");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Colonnes mises à jour")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Idées" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Idées" })).toBeVisible({ timeout: 30_000 });
  });

  test("on masque puis réaffiche une colonne depuis le tableau", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    await page.getByRole("button", { name: "Personnaliser le statut En cours" }).click();
    await page.getByRole("menuitem", { name: "Masquer le statut" }).click();
    await expectColumns(page, ["Backlog", "À faire", "En revue", "Terminé"]);

    await expect(page.getByText("1 statut masqué")).toBeVisible();
    await page.getByRole("button", { name: "En cours" }).click();

    await expect(page.getByRole("heading", { name: "En cours" })).toBeVisible({ timeout: 30_000 });
  });

  test("on déplace une colonne depuis le tableau", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    await page.getByRole("button", { name: "Personnaliser le statut À faire" }).click();
    await page.getByRole("menuitem", { name: "Déplacer à gauche" }).click();

    await expect(page.getByText("Colonnes mises à jour")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText("À faire");
  });

  test("on ajoute une colonne et elle persiste", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    await page.getByRole("button", { name: "Ajouter un statut" }).click();
    await expect(page.getByText("Colonnes mises à jour")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Personnaliser le statut Nouveau statut" }).click();
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    await page.getByLabel("Renommer le statut Nouveau statut").fill("Recette client");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "Recette client" })).toBeVisible({
      timeout: 30_000,
    });

    await page.reload();
    await expect(page.getByRole("heading", { name: "Recette client" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("supprimer une colonne déplace ses tâches vers celle choisie", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();

    await gotoIsolatedTasks(page, workspaceId);
    const name = await createTask(page, projectName);

    await gotoKanban(page, projectUrl);
    await page.getByRole("button", { name: "Personnaliser le statut Backlog" }).click();
    const deleteItem = page.getByRole("menuitem", { name: "Supprimer le statut" });
    await expect(deleteItem).toBeVisible();
    await deleteItem.click();

    await expect(page.getByText(/1 tâche s'y trouve/)).toBeVisible({ timeout: 30_000 });
    await page.getByLabel("Statut de destination").click();
    await page.getByRole("option").filter({ hasText: "À faire" }).click();
    await page.getByRole("button", { name: "Supprimer", exact: true }).click();

    await expectColumns(page, ["À faire", "En cours", "En revue", "Terminé"]);
    await expect(page.getByText(name).first()).toBeVisible();

    await page.reload();
    await expectColumns(page, ["À faire", "En cours", "En revue", "Terminé"]);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("la dernière colonne visible ne peut pas être masquée", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    const remaining = ["Backlog", "À faire", "En cours", "En revue", "Terminé"];
    for (const name of ["Backlog", "À faire", "En cours", "En revue"]) {
      await page.getByRole("button", { name: `Personnaliser le statut ${name}` }).click();
      await page.getByRole("menuitem", { name: "Masquer le statut" }).click();
      remaining.splice(remaining.indexOf(name), 1);
      await expectColumns(page, remaining);
    }

    await page.getByRole("button", { name: "Personnaliser le statut Terminé" }).click();
    await expect(page.getByRole("menuitem", { name: "Masquer le statut" })).toHaveAttribute(
      "data-disabled",
      "",
    );
  });

  test("on réordonne une colonne au glisser-déposer", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    await page.getByLabel("Déplacer le statut Backlog").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");

    await expectColumns(page, ["À faire", "Backlog", "En cours", "En revue", "Terminé"]);

    await page.reload();
    await expectColumns(page, ["À faire", "Backlog", "En cours", "En revue", "Terminé"]);
  });

  test("une tâche créée depuis une colonne y reste", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);
    const projectUrl = page.url();

    await gotoKanban(page, projectUrl);
    await page.getByRole("button", { name: "Ajouter un statut" }).click();
    await expectColumns(page, [
      "Backlog",
      "À faire",
      "En cours",
      "En revue",
      "Terminé",
      "Nouveau statut",
    ]);

    await page.getByRole("button", { name: "Ajouter une tâche dans Nouveau statut" }).click();
    const dialog = page.getByRole("dialog").first();
    const name = uniqueName("Tâche");
    await dialog.getByLabel("Nom de la tâche").fill(name);
    await selectFirstOption(dialog, "Priorité");
    await selectFirstOption(dialog, "Assigné à");
    await pickToday(dialog);
    await dialog.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    const column = page
      .locator("[data-rfd-droppable-id]")
      .filter({ hasText: name })
      .filter({ hasNot: page.locator("[data-rfd-droppable-id]") });
    await expect(column).toHaveAttribute("data-rfd-droppable-id", /^col_/, { timeout: 30_000 });
  });

  test("les couleurs de colonne sont définies au niveau du document", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    const missing = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return ["teal", "blue", "amber", "violet", "green", "rose", "zinc"].filter(
        (name) => !styles.getPropertyValue(`--color-column-${name}`).trim(),
      );
    });

    expect(missing).toEqual([]);
  });

  test("le formulaire propose les colonnes du projet", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);
    const projectUrl = page.url();

    await gotoKanban(page, projectUrl);
    await page.getByRole("button", { name: "Ajouter un statut" }).click();
    await expectColumns(page, [
      "Backlog",
      "À faire",
      "En cours",
      "En revue",
      "Terminé",
      "Nouveau statut",
    ]);

    await page.getByRole("button", { name: "Personnaliser le statut Nouveau statut" }).click();
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    await page.getByLabel("Renommer le statut Nouveau statut").fill("Recette client");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Recette client" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();
    const dialog = page.getByRole("dialog").first();
    const name = uniqueName("Tâche");
    await dialog.getByLabel("Nom de la tâche").fill(name);
    await selectOptionByName(dialog, "Statut", "Recette client");
    await selectFirstOption(dialog, "Priorité");
    await selectFirstOption(dialog, "Assigné à");
    await pickToday(dialog);
    await dialog.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    const column = page
      .locator("[data-rfd-droppable-id]")
      .filter({ hasText: name })
      .filter({ hasNot: page.locator("[data-rfd-droppable-id]") });
    await expect(column).toHaveAttribute("data-rfd-droppable-id", /^col_/, { timeout: 30_000 });
  });

  test("le projet n'est plus demandé quand on est déjà dedans", async ({ page, request }) => {
    const { projectUrl } = await openProject(page, request);
    await gotoKanban(page, projectUrl);

    await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();
    const dialog = page.getByRole("dialog").first();

    await expect(dialog.getByLabel("Statut")).toBeVisible();
    await expect(dialog.getByLabel("Projet")).toHaveCount(0);
  });

  test("le filtre propose les colonnes du projet et les applique", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();

    await gotoIsolatedTasks(page, workspaceId);
    const backlogTask = await createTask(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    await page.getByRole("button", { name: "Ajouter un statut" }).click();
    await expectColumns(page, [
      "Backlog",
      "À faire",
      "En cours",
      "En revue",
      "Terminé",
      "Nouveau statut",
    ]);

    await page.getByRole("button", { name: "Ajouter une tâche dans Nouveau statut" }).click();
    const dialog = page.getByRole("dialog").first();
    const customTask = uniqueName("Tâche");
    await dialog.getByLabel("Nom de la tâche").fill(customTask);
    await selectFirstOption(dialog, "Priorité");
    await selectFirstOption(dialog, "Assigné à");
    await pickToday(dialog);
    await dialog.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    await page.getByLabel("Filtrer par statut").click();
    await page.getByRole("option").filter({ hasText: "Nouveau statut" }).click();

    await expect(page).toHaveURL(/columnId=col_/);
    await expect(page.getByText(customTask).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(backlogTask)).toHaveCount(0);
  });
});
