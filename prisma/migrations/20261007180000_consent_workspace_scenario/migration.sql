-- Legal consent versions, per-user workspace, saved investment scenarios.

CREATE TABLE "legal_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'az',
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_consents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_consents_user_id_document_type_idx" ON "legal_consents"("user_id", "document_type");

ALTER TABLE "legal_consents" ADD CONSTRAINT "legal_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_workspaces" (
    "user_id" TEXT NOT NULL,
    "watchlist" JSONB NOT NULL,
    "compare" JSONB NOT NULL,
    "deals" JSONB NOT NULL,
    "alerts" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_workspaces_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "user_workspaces" ADD CONSTRAINT "user_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "investment_scenarios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "max_bid" DECIMAL(14,2),
    "market_reference" DECIMAL(14,2),
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formula_version" TEXT NOT NULL DEFAULT 'invest-v1',

    CONSTRAINT "investment_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investment_scenarios_user_id_lot_id_key" ON "investment_scenarios"("user_id", "lot_id");
CREATE INDEX "investment_scenarios_user_id_idx" ON "investment_scenarios"("user_id");

ALTER TABLE "investment_scenarios" ADD CONSTRAINT "investment_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
