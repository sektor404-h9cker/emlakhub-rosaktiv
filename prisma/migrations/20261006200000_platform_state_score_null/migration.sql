-- Старый score больше не пишется. Колонка остаётся для уже сохранённых строк.
ALTER TABLE "lots" ALTER COLUMN "score" DROP DEFAULT;

-- Общее состояние админки вместо localStorage.
CREATE TABLE "platform_state" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "system" JSONB NOT NULL,
    "ops" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_state_pkey" PRIMARY KEY ("id")
);
