import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret } from "./crypto";

describe("chiffrement des clés d'API", () => {
  it("retrouve la clé d'origine", () => {
    const secret = "sk-test-1234567890";
    const encrypted = encryptSecret(secret);
    expect(encrypted).toMatch(/^v1:/);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("ne produit jamais deux fois le même texte chiffré", () => {
    expect(encryptSecret("même clé")).not.toBe(encryptSecret("même clé"));
  });

  it("refuse un texte chiffré modifié", () => {
    const encrypted = encryptSecret("sk-test");
    const tampered = encrypted.slice(0, -4) + (encrypted.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
