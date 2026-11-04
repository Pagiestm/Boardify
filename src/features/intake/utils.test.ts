import { describe, expect, it } from "vitest";

import { intakeSubmissionSchema, intakeTokenSchema } from "./schemas";
import { buildIntakeDescription, clientIp, createRateLimiter, escapeMarkdown } from "./utils";

describe("createRateLimiter", () => {
  it("bloque au-delà de la limite puis libère après la fenêtre", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.hit("ip", 0)).toBe(true);
    expect(limiter.hit("ip", 100)).toBe(true);
    expect(limiter.hit("ip", 200)).toBe(false);
    expect(limiter.hit("autre", 200)).toBe(true);
    expect(limiter.hit("ip", 1001)).toBe(true);
  });

  it("ne compte pas une tentative refusée", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.hit("ip", 0)).toBe(true);
    expect(limiter.hit("ip", 900)).toBe(false);
    expect(limiter.hit("ip", 1000)).toBe(true);
  });
});

describe("buildIntakeDescription", () => {
  it("ajoute l'auteur sans laisser passer de mise en forme", () => {
    const description = buildIntakeDescription({
      name: "[Léa](https://evil.example)",
      email: "lea@example.com",
      description: "  Le bouton ne répond plus.  ",
    });
    expect(description.startsWith("Le bouton ne répond plus.\n\n---")).toBe(true);
    expect(description).toContain("**\\[Léa\\]\\(https://evil\\.example\\)**");
    expect(description).toContain("(lea@example\\.com)");
  });

  it("omet l'e-mail absent", () => {
    expect(buildIntakeDescription({ name: "Léa", email: "", description: "x" })).toContain(
      "par **Léa** via",
    );
  });

  it("échappe les caractères Markdown", () => {
    expect(escapeMarkdown("*a* _b_ #c")).toBe("\\*a\\* \\_b\\_ \\#c");
  });
});

describe("clientIp", () => {
  it("prend la première adresse transmise par le proxy", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("schémas", () => {
  it("n'accepte que des jetons de 32 caractères base64url", () => {
    expect(intakeTokenSchema.safeParse("a".repeat(32)).success).toBe(true);
    expect(intakeTokenSchema.safeParse("a".repeat(31)).success).toBe(false);
    expect(intakeTokenSchema.safeParse(`${"a".repeat(31)}/`).success).toBe(false);
  });

  it("valide une demande et borne les champs", () => {
    const valid = { name: "Léa", email: "", title: "Bug", description: "Détails" };
    expect(intakeSubmissionSchema.safeParse(valid).success).toBe(true);
    expect(intakeSubmissionSchema.safeParse({ ...valid, email: "pas-un-email" }).success).toBe(
      false,
    );
    expect(intakeSubmissionSchema.safeParse({ ...valid, title: "x".repeat(201) }).success).toBe(
      false,
    );
    expect(
      intakeSubmissionSchema.safeParse({ ...valid, description: "x".repeat(5001) }).success,
    ).toBe(false);
  });
});
