import { z } from "zod";

export const loginShema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1, "Requis"),
})

export const registerShema = z.object({
    name: z.string().trim().min(1, "Requis"),
    email: z.string().trim().email(),
    password: z.string().min(8, "Minimum 8 caractères requis"),
})