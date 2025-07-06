/*
  Warnings:

  - You are about to drop the column `properties` on the `MedicTestCatalog` table. All the data in the column will be lost.
  - Added the required column `gender` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'ANY');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('ADULT', 'CHILD', 'ANY');

-- AlterTable
ALTER TABLE "MedicTestCatalog" DROP COLUMN "properties";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "gender" "Gender" NOT NULL;

-- CreateTable
CREATE TABLE "MedicTestProperty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "catalogId" INTEGER NOT NULL,

    CONSTRAINT "MedicTestProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueReference" (
    "id" SERIAL NOT NULL,
    "range" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "medicTestPropertyId" INTEGER NOT NULL,

    CONSTRAINT "ValueReference_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicTestProperty" ADD CONSTRAINT "MedicTestProperty_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "MedicTestCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueReference" ADD CONSTRAINT "ValueReference_medicTestPropertyId_fkey" FOREIGN KEY ("medicTestPropertyId") REFERENCES "MedicTestProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
