"use client"

import { useId, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const questions = [
    {
        question: "Boardify est-il gratuit ?",
        answer: "Oui. Créez un compte et commencez à organiser vos projets sans carte bancaire.",
    },
    {
        question: "Comment inviter mon équipe ?",
        answer: "Chaque espace de travail possède un lien d'invitation. Partagez-le : vos collègues rejoignent l'espace en un clic. Vous pouvez régénérer le lien à tout moment.",
    },
    {
        question: "Quelle est la différence entre Admin et Membre ?",
        answer: "Les Admins gèrent l'espace de travail : paramètres, membres, rôles et suppression. Les Membres créent et suivent les projets et les tâches.",
    },
    {
        question: "Quelles vues sont disponibles pour les tâches ?",
        answer: "Trois vues : un kanban en glisser-déposer, un tableau triable et filtrable, et un calendrier mensuel des échéances.",
    },
    {
        question: "Comment me connecter ?",
        answer: "Avec votre adresse e-mail et un mot de passe, ou directement avec votre compte Google ou GitHub.",
    },
    {
        question: "Boardify fonctionne-t-il sur mobile ?",
        answer: "Oui, l'interface s'adapte aux petits écrans, et propose un thème clair et un thème sombre.",
    },
];

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
    const [open, setOpen] = useState(false);
    const id = useId();

    return (
        <div className="border-b">
            <h3>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={id}
                    onClick={() => setOpen((value) => !value)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium transition-colors hover:text-primary"
                >
                    {question}
                    <ChevronDownIcon
                        className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            open && "rotate-180"
                        )}
                    />
                </button>
            </h3>
            <div
                id={id}
                role="region"
                hidden={!open}
                className="pb-4 text-sm leading-relaxed text-muted-foreground"
            >
                {answer}
            </div>
        </div>
    );
};

export const Faq = () => {
    return (
        <section id="faq" className="scroll-mt-14 border-b">
            <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
                <Reveal>
                    <SectionHeading eyebrow="FAQ" title="Questions fréquentes" />
                </Reveal>
                <Reveal delay={0.05} className="mt-12 border-t">
                    {questions.map((item) => (
                        <FaqItem key={item.question} {...item} />
                    ))}
                </Reveal>
            </div>
        </section>
    );
};
