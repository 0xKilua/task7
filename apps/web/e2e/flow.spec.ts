import { expect, test } from "@playwright/test";
import path from "node:path";

const PORTRAIT = path.join(__dirname, "../../../services/vision/tests/fixtures/portrait.jpg");
const POSE = path.join(__dirname, "../../../services/vision/tests/fixtures/pose.jpg");

test.describe("parcours principal", () => {
  test("inscription, upload, simulation couleur et comparaison avant/apres", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("SuperSecret123!");
    await page.getByRole("button", { name: "Creer mon compte" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText(/Deposez votre photo ici/)).toBeVisible();

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByText(/Deposez votre photo ici/).click(),
    ]);
    await fileChooser.setFiles(PORTRAIT);

    await expect(page).toHaveURL(/\/studio\//, { timeout: 20_000 });

    // Module Couleur (selectionne par defaut)
    await expect(page.getByRole("button", { name: "Couleur", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Blond clair/ }).click();
    await page.getByRole("button", { name: "Generer la simulation" }).click();

    await expect(page.getByAltText("Avant")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByAltText("Apres")).toBeVisible();
    await expect(page.getByRole("button", { name: /favoris/i })).toBeVisible();
  });

  test("le module coiffure indique clairement l'absence de fournisseur IA configure", async ({ page }) => {
    const email = `e2e-coiffure-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("SuperSecret123!");
    await page.getByRole("button", { name: "Creer mon compte" }).click();

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByText(/Deposez votre photo ici/).click(),
    ]);
    await fileChooser.setFiles(PORTRAIT);
    await expect(page).toHaveURL(/\/studio\//, { timeout: 20_000 });

    await page.getByRole("button", { name: "Coiffure" }).click();
    await page.getByText(/pixie/i).first().click();
    await page.getByRole("button", { name: "Generer la simulation" }).click();

    await expect(page.getByText(/necessite un fournisseur IA externe/)).toBeVisible({ timeout: 20_000 });
  });

  test("le module silhouette simule visuellement une variation de poids sur une photo pied a tete", async ({
    page,
  }) => {
    const email = `e2e-silhouette-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("SuperSecret123!");
    await page.getByRole("button", { name: "Creer mon compte" }).click();

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByText(/Deposez votre photo ici/).click(),
    ]);
    await fileChooser.setFiles(POSE);
    await expect(page).toHaveURL(/\/studio\//, { timeout: 20_000 });

    await page.getByRole("button", { name: "Silhouette" }).click();
    await expect(page.getByText(/Simulation visuelle indicative/)).toBeVisible();
    await page.getByRole("button", { name: "+6 kg" }).click();
    await page.getByRole("button", { name: "Generer la simulation" }).click();

    await expect(page.getByAltText("Avant")).toBeVisible({ timeout: 30_000 });
  });
});
