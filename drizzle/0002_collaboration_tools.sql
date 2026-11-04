CREATE TABLE "docs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"task_ids" text[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "intake_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"token" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"title" text NOT NULL,
	"intro" text,
	"assignee_id" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poker_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"started_by" text NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"revealed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poker_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"member_id" text NOT NULL,
	"round" integer NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"remind_at" timestamp with time zone NOT NULL,
	"sent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retro_items" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"sprint_id" text NOT NULL,
	"member_id" text NOT NULL,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"task_id" text
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"member_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE INDEX "docs_project_id_index" ON "docs" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "intake_forms_token_index" ON "intake_forms" USING btree ("token");--> statement-breakpoint
CREATE INDEX "intake_forms_project_id_index" ON "intake_forms" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "poker_sessions_workspace_id_index" ON "poker_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "poker_votes_task_id_round_index" ON "poker_votes" USING btree ("task_id","round");--> statement-breakpoint
CREATE INDEX "reminders_user_id_sent_remind_at_index" ON "reminders" USING btree ("user_id","sent","remind_at");--> statement-breakpoint
CREATE INDEX "reminders_task_id_index" ON "reminders" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "retro_items_sprint_id_index" ON "retro_items" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "time_entries_task_id_index" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "time_entries_workspace_id_member_id_index" ON "time_entries" USING btree ("workspace_id","member_id");