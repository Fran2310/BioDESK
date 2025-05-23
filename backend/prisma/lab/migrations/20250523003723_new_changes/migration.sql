/*
  Warnings:

  - A unique constraint covering the columns `[role]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "State" AS ENUM ('PENDING', 'IN_PROCESS', 'TO_VERIFY', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "ActionHistory" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "madeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "labUserId" INTEGER NOT NULL,

    CONSTRAINT "ActionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "ci" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "secondName" TEXT,
    "secondLastName" TEXT,
    "email" TEXT NOT NULL,
    "phoneNums" TEXT[] DEFAULT ARRAY['']::TEXT[],
    "dir" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicHistory" (
    "id" SERIAL NOT NULL,
    "allergies" TEXT,
    "pathologies" TEXT,
    "patientId" INTEGER NOT NULL,

    CONSTRAINT "MedicHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestMedicTest" (
    "id" SERIAL NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "state" "State" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "observation" TEXT,
    "medicHistoryId" INTEGER NOT NULL,
    "medicTestCatalogId" INTEGER NOT NULL,

    CONSTRAINT "RequestMedicTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicTestCatalog" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "properties" JSONB,
    "supplies" TEXT[] DEFAULT ARRAY['']::TEXT[],
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MedicTestCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_ci_key" ON "Patient"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MedicHistory_patientId_key" ON "MedicHistory"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicTestCatalog_name_key" ON "MedicTestCatalog"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_key" ON "Role"("role");

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_labUserId_fkey" FOREIGN KEY ("labUserId") REFERENCES "LabUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicHistory" ADD CONSTRAINT "MedicHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMedicTest" ADD CONSTRAINT "RequestMedicTest_medicHistoryId_fkey" FOREIGN KEY ("medicHistoryId") REFERENCES "MedicHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMedicTest" ADD CONSTRAINT "RequestMedicTest_medicTestCatalogId_fkey" FOREIGN KEY ("medicTestCatalogId") REFERENCES "MedicTestCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
