-- DropForeignKey
ALTER TABLE "MedicHistory" DROP CONSTRAINT "MedicHistory_patientId_fkey";

-- DropForeignKey
ALTER TABLE "RequestMedicTest" DROP CONSTRAINT "RequestMedicTest_medicHistoryId_fkey";

-- AlterTable
ALTER TABLE "RequestMedicTest" ADD COLUMN     "byLabUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "MedicHistory" ADD CONSTRAINT "MedicHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMedicTest" ADD CONSTRAINT "RequestMedicTest_byLabUserId_fkey" FOREIGN KEY ("byLabUserId") REFERENCES "LabUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMedicTest" ADD CONSTRAINT "RequestMedicTest_medicHistoryId_fkey" FOREIGN KEY ("medicHistoryId") REFERENCES "MedicHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
