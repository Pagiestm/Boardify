CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"member_id" text,
	"type" text NOT NULL,
	"data" text
);
--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"base_url" text,
	"api_key_encrypted" text NOT NULL,
	"api_key_hint" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"member_id" text NOT NULL,
	"file_id" text NOT NULL,
	"name" text NOT NULL,
	"mime_type" text,
	"size" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"member_id" text NOT NULL,
	"content" text NOT NULL,
	"github_comment_id" text
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"workspace_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"calendar_token" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"actor_id" text,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"member_id" text NOT NULL,
	"location" text NOT NULL,
	"seen_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"workspace_id" text NOT NULL,
	"column_config" text,
	"github_repo" text
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"member_id" text NOT NULL,
	"name" text NOT NULL,
	"view" text NOT NULL,
	"filters" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"workspace_id" text NOT NULL,
	"assignee_id" text,
	"project_id" text NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"start_date" timestamp with time zone,
	"priority" text,
	"description" text,
	"label_ids" text[] DEFAULT '{}',
	"github_issue_url" text,
	"blocked_by" text[] DEFAULT '{}',
	"recurrence" text,
	"sprint_id" text,
	"estimate" integer
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"invite_code" text NOT NULL,
	"user_id" text NOT NULL,
	"github_installation_id" text
);
--> statement-breakpoint
CREATE INDEX "activities_task_id_index" ON "activities" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "activities_workspace_id_index" ON "activities" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_settings_workspace_id_index" ON "ai_settings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "attachments_task_id_index" ON "attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "attachments_workspace_id_index" ON "attachments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "checklist_items_task_id_index" ON "checklist_items" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "comments_task_id_index" ON "comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "comments_github_comment_id_index" ON "comments" USING btree ("github_comment_id");--> statement-breakpoint
CREATE INDEX "labels_workspace_id_index" ON "labels" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_workspace_id_user_id_index" ON "members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "members_user_id_index" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_index" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "notifications_task_id_index" ON "notifications" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "presence_workspace_id_index" ON "presence" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "projects_workspace_id_index" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "projects_github_repo_index" ON "projects" USING btree ("github_repo");--> statement-breakpoint
CREATE INDEX "saved_views_workspace_id_member_id_index" ON "saved_views" USING btree ("workspace_id","member_id");--> statement-breakpoint
CREATE INDEX "sprints_project_id_index" ON "sprints" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sprints_workspace_id_index" ON "sprints" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "task_templates_workspace_id_index" ON "task_templates" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "tasks_workspace_id_status_index" ON "tasks" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "tasks_project_id_index" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_id_index" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tasks_sprint_id_index" ON "tasks" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "tasks_due_date_index" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "tasks_github_issue_url_index" ON "tasks" USING btree ("github_issue_url");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_invite_code_index" ON "workspaces" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "workspaces_github_installation_id_index" ON "workspaces" USING btree ("github_installation_id");