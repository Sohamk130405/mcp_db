CREATE TABLE IF NOT EXISTS "db_checkpoints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "connection_id" uuid NOT NULL,
  "db_type" text NOT NULL,
  "table_name" text NOT NULL,
  "operation" text NOT NULL,
  "snapshot" jsonb NOT NULL,
  "note" text,
  "restored_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "db_checkpoints" ADD CONSTRAINT "db_checkpoints_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "db_checkpoints" ADD CONSTRAINT "db_checkpoints_connection_id_db_connections_id_fk"
 FOREIGN KEY ("connection_id") REFERENCES "db_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
