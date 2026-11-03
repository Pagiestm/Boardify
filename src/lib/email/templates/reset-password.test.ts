import { describe, expect, it } from "vitest";

import { renderMjml } from "../index";
import { resetPasswordEmail } from "./reset-password";

const URL = "https://boardify.app/reset-password?userId=u1&secret=abc";

describe("resetPasswordEmail", () => {
  it("contient le lien dans le texte et dans le HTML", async () => {
    const email = resetPasswordEmail({ to: "a@b.c", name: "Léa", url: URL });

    expect(email.subject).toBe("Réinitialiser votre mot de passe Boardify");
    expect(email.text).toContain(URL);
    expect(email.text).toContain("Bonjour Léa,");

    const html = await renderMjml(email.mjml);
    expect(html).toContain('href="https://boardify.app/reset-password?userId=u1&amp;secret=abc"');
    expect(html).toContain("Choisir un nouveau mot de passe");
  });

  it("échappe le nom de la personne", async () => {
    const email = resetPasswordEmail({ to: "a@b.c", name: '<img src=x onerror="x">', url: URL });
    const html = await renderMjml(email.mjml);

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });
});
