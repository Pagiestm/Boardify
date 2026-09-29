import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const steps = [
    {
        title: "Créez un espace de travail",
        description: "Donnez-lui un nom et une image, puis ajoutez vos premiers projets.",
    },
    {
        title: "Invitez votre équipe",
        description: "Partagez le lien d'invitation et choisissez qui est Admin ou Membre.",
    },
    {
        title: "Suivez l'avancement",
        description: "Assignez les tâches, fixez des échéances et gardez un œil sur les statistiques.",
    },
];

export const HowItWorks = () => {
    return (
        <section className="border-b">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
                <Reveal>
                    <SectionHeading
                        eyebrow="Comment ça marche"
                        title="Opérationnel en quelques minutes"
                    />
                </Reveal>
                <div className="mt-14 grid gap-8 sm:grid-cols-3">
                    {steps.map((step, index) => (
                        <Reveal key={step.title} delay={index * 0.05}>
                            <div className="flex flex-col gap-3 border-t pt-5">
                                <span className="text-sm font-medium text-primary">Étape {index + 1}</span>
                                <h3 className="text-base font-semibold">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};
