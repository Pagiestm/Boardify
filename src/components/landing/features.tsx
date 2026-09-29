import {
    BarChart3Icon,
    FolderKanbanIcon,
    KeyboardIcon,
    LayersIcon,
    LayoutGridIcon,
    ListChecksIcon,
    UsersIcon,
} from "lucide-react";

import { Kbd } from "@/components/ui/kbd";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const features = [
    {
        icon: LayersIcon,
        title: "Espaces de travail",
        description: "Un espace par équipe ou par client, et vous passez de l'un à l'autre en un clic.",
    },
    {
        icon: FolderKanbanIcon,
        title: "Projets",
        description: "Chaque espace regroupe ses projets, avec leur image et leurs propres statistiques.",
    },
    {
        icon: ListChecksIcon,
        title: "Tâches détaillées",
        description: "Statut, priorité, personne assignée, échéance et description pour chaque tâche.",
    },
    {
        icon: LayoutGridIcon,
        title: "Trois vues",
        description: "Kanban en glisser-déposer, tableau triable et filtrable, calendrier mensuel.",
    },
    {
        icon: BarChart3Icon,
        title: "Statistiques",
        description: "Tâches totales, assignées, terminées et en retard, comparées au mois précédent.",
    },
    {
        icon: UsersIcon,
        title: "Équipe et rôles",
        description: "Invitez par lien et répartissez les rôles Admin et Membre.",
    },
];

export const Features = () => {
    return (
        <section id="fonctionnalites" className="scroll-mt-14 border-b">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
                <Reveal>
                    <SectionHeading
                        eyebrow="Fonctionnalités"
                        title="L'essentiel pour faire avancer vos projets"
                        description="Pas de configuration compliquée : les outils dont une équipe a besoin au quotidien, et rien de plus."
                    />
                </Reveal>
                <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, description }, index) => (
                        <Reveal key={title} delay={(index % 3) * 0.05}>
                            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50">
                                <Icon className="size-4.5 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold">{title}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="mt-14">
                    <div className="flex flex-col items-start gap-3 rounded-lg border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3 sm:items-center">
                            <KeyboardIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:mt-0" />
                            <p className="text-sm">
                                <span className="font-medium">Raccourcis clavier.</span>{" "}
                                <span className="text-muted-foreground">
                                    Ouvrez la recherche avec ⌘K, créez une tâche avec N, un projet avec P.
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {["⌘K", "N", "P", "?"].map((key) => (
                                <Kbd key={key}>{key}</Kbd>
                            ))}
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
};
