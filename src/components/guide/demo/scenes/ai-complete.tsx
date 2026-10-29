import { ListChecksIcon, Loader2Icon, SparklesIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import {
  MiniAvatar,
  PreviewTaskCard,
  SAMPLE_TASKS,
  SampleTask,
} from "@/components/landing/preview-data";

import { MockKanban, TaskToolbar } from "./create-task";
import {
  AppFrame,
  MockButton,
  MockDialog,
  MockField,
  MockSelect,
  MockToast,
  highlight,
} from "../mock";
import { DemoScene, between, fadeIn, progress, typed, typingDuration } from "../timeline";

const NAME = "Refonte de la page tarifs";
const DESCRIPTION =
  "Présenter clairement les trois offres et faciliter le passage à l'abonnement. La page actuelle date de 2023 et ne reflète plus les nouveaux prix.";
const SUBTASKS = [
  "Lister les offres et les nouveaux prix",
  "Concevoir la maquette",
  "Intégrer la page",
  "Tester le parcours d'abonnement",
];
const STREAM_SPEED = 48;

const NEW_TASK: SampleTask = {
  id: "new",
  name: NAME,
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  assignee: "Léa",
  project: "Site vitrine",
  start: 31,
  day: 31,
};

const OPEN = 200;
const TYPE = 800;
const AI = TYPE + typingDuration(NAME) + 500;
const CLICK_AI = AI + 700;
const FILL = CLICK_AI + 1500;
const STREAMED = FILL + typingDuration(DESCRIPTION, STREAM_SPEED);
const CREATE = STREAMED + 1500;
const CLICK_CREATE = CREATE + 700;
const CLOSE = CLICK_CREATE + 100;
const SHOW_CARD = CLOSE + 500;
const END = SHOW_CARD + 2800;

export const aiCompleteScene: DemoScene = {
  id: "ai-complete",
  title: "Compléter une tâche avec l'IA",
  duration: END,
  steps: [
    { at: 0, label: "Saisissez le nom de la tâche" },
    { at: AI, label: "Cliquez sur Compléter avec l'IA" },
    { at: FILL, label: "Description, sous-tâches, priorité et estimation sont proposées" },
    { at: CREATE, label: "Vérifiez, puis cliquez sur Créer" },
  ],
  clicks: [CLICK_AI, CLICK_CREATE],
  cursor: [
    { at: 0, x: 600, y: 420 },
    { at: AI, target: "btn-ai" },
    { at: CLICK_AI + 300, x: 700, y: 330 },
    { at: CREATE, target: "btn-create" },
    { at: CLOSE + 300, x: 640, y: 440 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: OPEN + 200, target: "field-name", zoom: 1.6 },
    { at: AI - 200, target: "btn-ai", dx: 80, zoom: 1.6 },
    { at: FILL + 450, target: "draft-subtasks", zoom: 1.5 },
    { at: FILL + 1400, target: "draft-description", zoom: 1.5 },
    { at: STREAMED, target: "draft-meta", zoom: 1.5 },
    { at: CREATE + 200, target: "btn-create", dx: -60, zoom: 1.5 },
    { at: CLOSE, x: 440, y: 275, zoom: 1 },
    { at: SHOW_CARD, target: "card-new", zoom: 1.7 },
  ],
  render: (t) => {
    const dialog = t < CLOSE ? fadeIn(t, OPEN) : 1 - progress(t, CLOSE, CLOSE + 250);
    const name = typed(t, TYPE, NAME);
    const loading = between(t, CLICK_AI, FILL);
    const filled = t >= FILL;
    const description = filled ? typed(t, FILL, DESCRIPTION, STREAM_SPEED) : "";
    const subtasks = SUBTASKS.filter((_, index) => t >= FILL + 400 + index * 250);
    const tasks = t >= CLOSE ? [NEW_TASK, ...SAMPLE_TASKS] : SAMPLE_TASKS;

    return (
      <AppFrame
        title="Site vitrine"
        active="Site vitrine"
        overlay={
          <>
            <MockDialog
              title="Créer une tâche"
              visible={dialog}
              width={540}
              footer={
                <>
                  <MockButton variant="outline">Annuler</MockButton>
                  <MockButton demo="btn-create" hover={between(t, CREATE + 600, CLOSE)}>
                    Créer
                  </MockButton>
                </>
              }
            >
              <div className="flex flex-col gap-3">
                <MockField
                  demo="field-name"
                  label="Nom de la tâche"
                  placeholder="Ex. : Préparer la démo client"
                  value={name}
                  focused={between(t, OPEN, AI)}
                />
                <div className="flex items-center gap-3">
                  <MockButton
                    demo="btn-ai"
                    size="sm"
                    variant="outline"
                    hover={between(t, CLICK_AI - 300, CLICK_AI + 100)}
                  >
                    {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
                    {loading
                      ? "Réflexion…"
                      : filled
                        ? "Recompléter avec l'IA"
                        : "Compléter avec l'IA"}
                  </MockButton>
                  <span className="text-[11px] text-muted-foreground">
                    {name.length >= 3
                      ? "Description, sous-tâches, priorité et estimation à partir du nom."
                      : "Saisissez d'abord le nom de la tâche."}
                  </span>
                </div>
                {subtasks.length > 0 && (
                  <div
                    data-demo="draft-subtasks"
                    className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-2.5"
                    style={highlight(progress(t, FILL + 400, FILL + 2000))}
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <ListChecksIcon className="size-3.5" />
                      Sous-tâches ajoutées à la création
                    </p>
                    {subtasks.map((item, index) => (
                      <span
                        key={item}
                        className="flex items-center gap-2 text-xs"
                        style={{ opacity: fadeIn(t, FILL + 400 + index * 250) }}
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span className="flex-1">{item}</span>
                        <XIcon className="size-3 text-muted-foreground" />
                      </span>
                    ))}
                  </div>
                )}
                <MockField
                  demo="draft-description"
                  label="Description"
                  placeholder="Ajoutez des détails…"
                  value={description}
                  multiline
                />
                <div data-demo="draft-meta" className="grid grid-cols-3 gap-3">
                  <div
                    className="rounded-md"
                    style={highlight(progress(t, FILL + 300, FILL + 1800))}
                  >
                    <MockSelect
                      label="Priorité"
                      value={
                        t >= FILL + 300 ? (
                          <Badge variant={TaskPriority.HIGH}>Haute</Badge>
                        ) : (
                          <span className="text-muted-foreground">Choisir</span>
                        )
                      }
                    />
                  </div>
                  <MockSelect
                    label="Assigné à"
                    value={
                      <>
                        <MiniAvatar name="Léa" />
                        Léa
                      </>
                    }
                  />
                  <div
                    className="rounded-md"
                    style={highlight(progress(t, FILL + 500, FILL + 2000))}
                  >
                    <MockField
                      label="Estimation (points)"
                      value={t >= FILL + 500 ? "5" : ""}
                      placeholder="Ex. : 3"
                    />
                  </div>
                </div>
              </div>
            </MockDialog>
            <MockToast visible={between(t, FILL, FILL + 2800) ? fadeIn(t, FILL) : 0}>
              Tâche complétée par l&apos;assistant : vérifiez avant de créer
            </MockToast>
            <MockToast visible={between(t, CLOSE, CLOSE + 2600) ? fadeIn(t, CLOSE) : 0}>
              Tâche créée
            </MockToast>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TaskToolbar />
          <MockKanban
            tasks={tasks}
            render={(task) =>
              task.id === "new" ? (
                <div
                  className="rounded-md"
                  style={highlight(progress(t, SHOW_CARD, SHOW_CARD + 1800))}
                >
                  <PreviewTaskCard task={task} />
                </div>
              ) : (
                <PreviewTaskCard task={task} />
              )
            }
          />
        </div>
      </AppFrame>
    );
  },
};
