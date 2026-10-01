import { test, expect } from "@playwright/test";

import { gotoWorkspace } from "../helpers";

test.describe("Cookie de session", () => {
  test("il reste privé et limité à ce site", async ({ page, context }) => {
    await gotoWorkspace(page);

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name.includes("session"));

    expect(session).toBeTruthy();
    expect(session?.httpOnly).toBe(true);
    expect(session?.secure).toBe(true);
    expect(session?.sameSite).toBe("Strict");
  });
});
