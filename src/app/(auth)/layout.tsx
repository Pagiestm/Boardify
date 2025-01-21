"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    const IsSignIn = usePathname() === "/sign-in";

    return (
        <main className="bg-neutral-100 dark:bg-background min-h-screen">
            <div className="mx-auto max-w-screen-2xl p-4">
                <nav className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Image src="/logo.svg" alt="logo" className="dark:invert" width={48} height={48} />
                        <span className="ml-2 text-2xl font-bold">Boardify</span>
                    </div>
                    <Button asChild variant="secondary">
                        <Link href={IsSignIn ? "/sign-up" : "/sign-in"}>
                            {IsSignIn ? "S'inscrire" : "Connexion"}
                        </Link>
                    </Button>
                </nav>
                <div className="flex flex-col items-center justify-center pt-4 md:pt-14">
                    {children}
                </div>
            </div>
        </main>
    );
}

export default AuthLayout;