"use client"

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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { loginShema } from "@/features/auth/schemas";

import { useLogin } from "../api/use-login";
import { AuthPane } from "./auth-pane";
import { AuthDivider, OAuthButtons, PasswordInput } from "./auth-fields";

export const SignInCard = () => {
    const { mutate, isPending } = useLogin();

    const form = useForm<z.input<typeof loginShema>, unknown, z.output<typeof loginShema>>({
        resolver: zodResolver(loginShema),
        defaultValues: {
            email: "",
            password: "",
        }
    })

    const onSubmit = (values: z.output<typeof loginShema>) => {
        mutate({ json: values })
    }

    return (
        <AuthPane
            title="Connexion"
            description="Content de vous revoir sur Boardify."
            footer={
                <>
                    Pas encore de compte ?{" "}
                    <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Créer un compte
                    </Link>
                </>
            }
        >
            <OAuthButtons disabled={isPending} />
            <AuthDivider />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                    <PasswordInput
                                        {...field}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending && <Spinner className="text-primary-foreground" />}
                        Se connecter
                    </Button>
                </form>
            </Form>
        </AuthPane>
    );
}
