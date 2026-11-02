import { z } from "zod";

export const loginShema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Requis"),
});

export const recoverySchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
  password: z.string().min(8, "Minimum 8 caractères requis"),
});

export const registerShema = z.object({
  name: z.string().trim().min(1, "Requis"),
  email: z.string().trim().email(),
  password: z.string().min(8, "Minimum 8 caractères requis"),
});
