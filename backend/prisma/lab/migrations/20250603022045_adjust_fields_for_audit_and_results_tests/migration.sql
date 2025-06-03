/*
  Warnings:

  - Added the required column `entity` to the `ActionHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationData` to the `ActionHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordEntityId` to the `ActionHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActionHistory" ADD COLUMN     "entity" TEXT NOT NULL,
ADD COLUMN     "operationData" JSONB NOT NULL,
ADD COLUMN     "recordEntityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RequestMedicTest" ADD COLUMN     "resultProperties" JSONB;
