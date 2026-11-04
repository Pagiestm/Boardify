import { z } from "zod";

export const INTAKE_TITLE_MAX = 120;
export const INTAKE_INTRO_MAX = 1000;

/** Jeton de l'adresse publique : 32 caractères base64url (192 bits aléatoires). */
export const intakeTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/);

/** Réglages du formulaire, modifiables par un administrateur de l'espace. */
export const intakeSettingsSchema = z.object({
  title: z.string().trim().min(1, "Requis").max(INTAKE_TITLE_MAX),
  intro: z.string().trim().max(INTAKE_INTRO_MAX).optional(),
  assigneeId: z.string().min(1, "Requis").max(36),
  status: z.string().min(1, "Requis").max(50),
  enabled: z.boolean(),
});

export type IntakeSettings = z.infer<typeof intakeSettingsSchema>;

/** Demande envoyée depuis la page publique. `website` est un champ piège, invisible pour un humain. */
export const intakeSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Indiquez votre nom").max(100),
  email: z
    .union([z.literal(""), z.string().trim().email("Adresse e-mail invalide").max(200)])
    .optional(),
  title: z.string().trim().min(3, "Au moins 3 caractères").max(200),
  description: z.string().trim().min(1, "Décrivez votre demande").max(5000),
  website: z.string().max(200).optional(),
});

export type IntakeSubmission = z.infer<typeof intakeSubmissionSchema>;
