-- Additive status fields for a full catalog sync versus a partial update of known lots.

ALTER TABLE "herrac_sync_state" ADD COLUMN "last_full_sync_at" TIMESTAMP(3);
ALTER TABLE "herrac_sync_state" ADD COLUMN "outcome" TEXT;
ALTER TABLE "herrac_sync_state" ADD COLUMN "catalog_status" TEXT;
ALTER TABLE "herrac_sync_state" ADD COLUMN "detail_status" TEXT;
ALTER TABLE "herrac_sync_state" ADD COLUMN "discovered_new" INTEGER NOT NULL DEFAULT 0;
