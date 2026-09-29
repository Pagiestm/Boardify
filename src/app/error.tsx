"use client"

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { PageError } from "@/components/page-error";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <PageError
            className="min-h-screen"
            message="Quelque chose s'est mal passé"
            description="Une erreur inattendue est survenue. Vous pouvez réessayer ou revenir à l'accueil."
        >
            <Button onClick={() => reset()}>Réessayer</Button>
            <Button variant="outline" asChild>
                <Link href="/dashboard">Retour à l&apos;accueil</Link>
            </Button>
        </PageError>
    );
}

export default ErrorPage
