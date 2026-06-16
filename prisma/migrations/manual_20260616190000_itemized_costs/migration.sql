-- CreateTable: clinic_cost_items
CREATE TABLE "clinic_cost_items" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "monthly_value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_cost_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "clinic_cost_items"
  ADD CONSTRAINT "clinic_cost_items_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: procedures - add category column
ALTER TABLE "procedures" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'outros';
