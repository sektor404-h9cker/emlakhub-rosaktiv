-- Growth: referral codes, one-time bonus grants, product events, payment refund fields.
-- Existing payments and subscriptions stay in place.

ALTER TABLE "payments" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "payments" ADD COLUMN "refunded_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "refund_reason" TEXT;

CREATE TABLE "referral_codes" (
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

ALTER TABLE "referral_codes"
ADD CONSTRAINT "referral_codes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "signals" JSONB,
    "reward_payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_referred_id_key" ON "referrals"("referred_id");
CREATE UNIQUE INDEX "referrals_reward_payment_id_key" ON "referrals"("reward_payment_id");
CREATE INDEX "referrals_referrer_id_created_at_idx" ON "referrals"("referrer_id", "created_at" DESC);

ALTER TABLE "referrals"
ADD CONSTRAINT "referrals_referrer_id_fkey"
FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals"
ADD CONSTRAINT "referrals_referred_id_fkey"
FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals"
ADD CONSTRAINT "referrals_not_self" CHECK ("referrer_id" <> "referred_id");

CREATE TABLE "referral_grants" (
    "id" TEXT NOT NULL,
    "referral_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "payment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'granted',
    "idempotency_key" TEXT NOT NULL,
    "expires_before" TIMESTAMP(3),
    "expires_after" TIMESTAMP(3),
    "reverse_reason" TEXT,
    "reversed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_grants_idempotency_key_key" ON "referral_grants"("idempotency_key");
CREATE INDEX "referral_grants_user_id_idx" ON "referral_grants"("user_id");
CREATE INDEX "referral_grants_payment_id_idx" ON "referral_grants"("payment_id");

ALTER TABLE "referral_grants"
ADD CONSTRAINT "referral_grants_referral_id_fkey"
FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_grants"
ADD CONSTRAINT "referral_grants_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "delivery" TEXT NOT NULL DEFAULT 'not_sent',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_events_user_id_created_at_idx" ON "product_events"("user_id", "created_at" DESC);
CREATE INDEX "product_events_type_idx" ON "product_events"("type");

ALTER TABLE "product_events"
ADD CONSTRAINT "product_events_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
