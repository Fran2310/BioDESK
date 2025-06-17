-- DropForeignKey
ALTER TABLE "MedicTestProperty" DROP CONSTRAINT "MedicTestProperty_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "ValueReference" DROP CONSTRAINT "ValueReference_medicTestPropertyId_fkey";

-- AddForeignKey
ALTER TABLE "MedicTestProperty" ADD CONSTRAINT "MedicTestProperty_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "MedicTestCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueReference" ADD CONSTRAINT "ValueReference_medicTestPropertyId_fkey" FOREIGN KEY ("medicTestPropertyId") REFERENCES "MedicTestProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
