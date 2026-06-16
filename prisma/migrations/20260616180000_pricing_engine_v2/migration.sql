-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('pix', 'card', 'both');

-- AlterTable: clinic_cost_profiles
ALTER TABLE "clinic_cost_profiles"
  ADD COLUMN "days_per_month" INTEGER NOT NULL DEFAULT 22,
  ADD COLUMN "hours_per_day" DOUBLE PRECISION NOT NULL DEFAULT 8,
  ADD COLUMN "occupancy_pct" DOUBLE PRECISION NOT NULL DEFAULT 70,
  ADD COLUMN "occupancy_estimated" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'both',
  ADD COLUMN "card_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "tax_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "target_margin_pct" DOUBLE PRECISION NOT NULL DEFAULT 35;

-- AlterTable: procedures
ALTER TABLE "procedures"
  ADD COLUMN "time_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "return_time_minutes" INTEGER NOT NULL DEFAULT 0;

-- DataMigration: backfill defaults for existing clinic(s) per approved plan
-- (days=22, hours=8, occupancy=70%, card_fee=4.5%, tax=6%, target_margin=35%)
UPDATE "clinic_cost_profiles"
SET
  "days_per_month" = 22,
  "hours_per_day" = 8,
  "occupancy_pct" = 70,
  "occupancy_estimated" = true,
  "card_fee_pct" = 4.5,
  "tax_pct" = 6,
  "target_margin_pct" = 35;
