ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

UPDATE "users"
SET "email" = CONCAT('legacy-user-', "id"::text, '@local.test')
WHERE "email" IS NULL;

UPDATE "users"
SET "password_hash" = md5(random()::text || clock_timestamp()::text)
WHERE "password_hash" IS NULL;

UPDATE "users"
SET "plan" = 'free'
WHERE "plan" IS NULL;

UPDATE "users"
SET "created_at" = now()
WHERE "created_at" IS NULL;

UPDATE "users"
SET "updated_at" = now()
WHERE "updated_at" IS NULL;

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "plan" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_hash" text;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_prefix" text;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "scopes" text[] DEFAULT ARRAY['read']::text[];
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "rate_limit" integer DEFAULT 100;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "last_used_at" timestamp with time zone;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();

UPDATE "api_keys"
SET "key_hash" = encode(digest("key", 'sha256'), 'hex')
WHERE "key_hash" IS NULL AND "key" IS NOT NULL;

UPDATE "api_keys"
SET "key_prefix" = left("key", 12)
WHERE "key_prefix" IS NULL AND "key" IS NOT NULL;

UPDATE "api_keys"
SET "name" = 'Migrated Legacy Key'
WHERE "name" IS NULL;

UPDATE "api_keys"
SET "scopes" = ARRAY['read']::text[]
WHERE "scopes" IS NULL;

UPDATE "api_keys"
SET "rate_limit" = 100
WHERE "rate_limit" IS NULL;

UPDATE "api_keys"
SET "created_at" = now()
WHERE "created_at" IS NULL;

ALTER TABLE "api_keys" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "key_hash" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "key_prefix" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "scopes" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "rate_limit" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "created_at" SET NOT NULL;

DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
