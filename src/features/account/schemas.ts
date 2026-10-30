import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(128, "128 caractères maximum"),
});

export const updateEmailSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  password: z.string().min(8, "8 caractères minimum").max(256, "256 caractères maximum"),
});

export const deleteAccountSchema = z.object({
  email: z.string().min(1, "Saisissez votre adresse e-mail"),
});
