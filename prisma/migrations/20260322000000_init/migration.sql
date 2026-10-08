-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "role" TEXT NOT NULL DEFAULT 'investor',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "subscription_plan" TEXT NOT NULL DEFAULT 'free',
    "subscription_starts_at" TIMESTAMP(3),
    "subscription_expires_at" TIMESTAMP(3),
    "job_title" TEXT,
    "department" TEXT,
    "avatar_id" TEXT,
    "presence" TEXT DEFAULT 'online',
    "last_ip" TEXT,
    "last_geo" TEXT,
    "last_device" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "plan_id" TEXT NOT NULL,
    "plan_days" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "active_from" TIMESTAMP(3),
    "active_to" TIMESTAMP(3),
    "provider_ref" TEXT,
    "note" TEXT,
    "confirmed_by_email" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "registry_no" TEXT,
    "title_az" TEXT,
    "title_ru" TEXT,
    "title_en" TEXT,
    "city_az" TEXT,
    "city_ru" TEXT,
    "market" TEXT DEFAULT 'estate',
    "start_price" DECIMAL(14,2),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "score" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "action" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "lots_status_idx" ON "lots"("status");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
