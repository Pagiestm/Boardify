import { MemberRole } from "./types";

type RoleHolder = { $id: string; role: MemberRole };

export const countAdmins = (members: RoleHolder[]) =>
  members.filter((member) => member.role === MemberRole.ADMIN).length;

/** Retirer ce membre, ou lui ôter le rôle d'admin, laisserait l'espace sans administrateur. */
export const isLastAdmin = (members: RoleHolder[], target: RoleHolder) =>
  target.role === MemberRole.ADMIN && countAdmins(members) === 1;

/** Pourquoi un membre ne peut pas quitter l'espace, s'il ne le peut pas. */
export const leaveBlocker = ({
  role,
  memberCount,
  adminCount,
}: {
  role: MemberRole;
  memberCount: number;
  adminCount: number;
}) => {
  if (memberCount === 1) {
    return "Vous êtes seul dans cet espace : supprimez-le depuis ses paramètres.";
  }
  if (role === MemberRole.ADMIN && adminCount === 1) {
    return "Nommez un autre administrateur avant de quitter cet espace.";
  }
  return null;
};
