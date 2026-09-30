"use client";

import { CalendarDaysIcon, KanbanSquareIcon, TableIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/features/tasks/constants";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { MiniAvatar, PreviewKanban, SAMPLE_TASKS } from "./preview-data";

const TablePreview = () => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[620px] text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="px-4 py-2.5 font-medium">Tâche</th>
          <th className="px-4 py-2.5 font-medium">Projet</th>
          <th className="px-4 py-2.5 font-medium">Assignée à</th>
          <th className="px-4 py-2.5 font-medium">Échéance</th>
          <th className="px-4 py-2.5 font-medium">Priorité</th>
          <th className="px-4 py-2.5 font-medium">Statut</th>
        </tr>
      </thead>
      <tbody>
        {SAMPLE_TASKS.slice(0, 6).map((task) => (
          <tr key={task.id} className="border-b last:border-0">
            <td className="px-4 py-2.5 font-medium">{task.name}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{task.project}</td>
            <td className="px-4 py-2.5">
              <span className="flex items-center gap-2">
                <MiniAvatar name={task.assignee} />
                {task.assignee}
              </span>
            </td>
            <td className="px-4 py-2.5 text-muted-foreground">{task.day} oct.</td>
            <td className="px-4 py-2.5">
              <Badge variant={task.priority}>{TASK_PRIORITY_CONFIG[task.priority].label}</Badge>
            </td>
            <td className="px-4 py-2.5">
              <Badge variant={task.status} dot>
                {TASK_STATUS_CONFIG[task.status].label}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const CalendarPreview = () => {
  const offset = 3;
  const cells = Array.from({ length: 35 }, (_, index) => index - offset + 1);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[620px] grid-cols-7 text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="border-b px-2 py-2 font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          const inMonth = day >= 1 && day <= 31;
          const tasks = inMonth ? SAMPLE_TASKS.filter((task) => task.day === day) : [];

          return (
            <div
              key={index}
              className={cn(
                "min-h-20 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "text-[11px]",
                  inMonth ? "text-muted-foreground" : "text-muted-foreground/40",
                )}
              >
                {inMonth ? day : ""}
              </span>
              <div className="mt-1 flex flex-col gap-1">
                {tasks.map((task) => (
                  <span
                    key={task.id}
                    className={cn(
                      "truncate rounded-sm border-l-2 bg-muted px-1.5 py-0.5 text-[11px]",
                      TASK_STATUS_CONFIG[task.status].border,
                    )}
                  >
                    {task.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const views = [
  {
    value: "kanban",
    label: "Kanban",
    icon: KanbanSquareIcon,
    description: "Faites glisser les tâches d'une colonne à l'autre pour changer leur statut.",
  },
  {
    value: "table",
    label: "Tableau",
    icon: TableIcon,
    description: "Triez et filtrez par statut, personne assignée, projet ou échéance.",
  },
  {
    value: "calendar",
    label: "Calendrier",
    icon: CalendarDaysIcon,
    description: "Visualisez les échéances du mois et anticipez les semaines chargées.",
  },
];

export const ViewsSection = () => {
  return (
    <section id="vues" className="scroll-mt-14 border-b bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Vues"
            title="Les mêmes tâches, trois façons de les voir"
            description="Changez de vue à tout moment : tout reste synchronisé."
          />
        </Reveal>
        <Reveal delay={0.05} className="mt-12">
          <Tabs defaultValue="kanban" className="flex flex-col items-center">
            <TabsList>
              {views.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {views.map(({ value, description }) => (
              <TabsContent key={value} value={value} className="mt-6 w-full">
                <p className="mb-6 text-center text-sm text-muted-foreground">{description}</p>
                <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
                  {value === "kanban" && (
                    <div className="overflow-x-auto p-4">
                      <PreviewKanban />
                    </div>
                  )}
                  {value === "table" && <TablePreview />}
                  {value === "calendar" && <CalendarPreview />}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>
      </div>
    </section>
  );
};
