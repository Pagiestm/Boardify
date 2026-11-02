import { describe, expect, it } from "vitest";

import { MemberRole } from "./types";
import { countAdmins, isLastAdmin, leaveBlocker } from "./rules";

const admin = (id: string) => ({ $id: id, role: MemberRole.ADMIN });
const member = (id: string) => ({ $id: id, role: MemberRole.MEMBER });

describe("dernier administrateur", () => {
  it("compte les administrateurs", () => {
    expect(countAdmins([admin("a"), member("b"), admin("c")])).toBe(2);
  });

  it("protège le seul administrateur", () => {
    const members = [admin("a"), member("b")];
    expect(isLastAdmin(members, members[0])).toBe(true);
    expect(isLastAdmin(members, members[1])).toBe(false);
  });

  it("autorise à retirer un administrateur s'il en reste un autre", () => {
    const members = [admin("a"), admin("b")];
    expect(isLastAdmin(members, members[0])).toBe(false);
  });
});

describe("quitter un espace", () => {
  it("impossible quand on est seul", () => {
    expect(leaveBlocker({ role: MemberRole.ADMIN, memberCount: 1, adminCount: 1 })).toMatch(/seul/);
  });

  it("impossible pour le seul admin d'un espace partagé", () => {
    expect(leaveBlocker({ role: MemberRole.ADMIN, memberCount: 3, adminCount: 1 })).toMatch(
      /administrateur/,
    );
  });

  it("possible pour un membre, ou un admin parmi d'autres", () => {
    expect(leaveBlocker({ role: MemberRole.MEMBER, memberCount: 3, adminCount: 1 })).toBeNull();
    expect(leaveBlocker({ role: MemberRole.ADMIN, memberCount: 3, adminCount: 2 })).toBeNull();
  });
});
