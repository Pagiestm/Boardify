"use client";

import { z } from "zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerShema } from "@/features/auth/schemas";

import { useRegister } from "../api/use-register";
import { AuthPane } from "./auth-pane";
import { AuthDivider, OAuthButtons, PasswordInput } from "./auth-fields";

export const SignUpCard = () => {
  const { mutate, isPending } = useRegister();

  const form = useForm<z.input<typeof registerShema>, unknown, z.output<typeof registerShema>>({
    resolver: zodResolver(registerShema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.output<typeof registerShema>) => {
    mutate({ json: values });
  };

  return (
    <AuthPane
      title="Créer un compte"
      description="Commencez à organiser vos projets en quelques secondes."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <OAuthButtons disabled={isPending} />
      <AuthDivider />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input {...field} type="text" autoComplete="name" placeholder="Camille Martin" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="new-password" placeholder="••••••••" />
                </FormControl>
                <FormDescription>8 caractères minimum.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Spinner className="text-primary-foreground" />}
            Créer mon compte
          </Button>
        </form>
      </Form>
    </AuthPane>
  );
};
