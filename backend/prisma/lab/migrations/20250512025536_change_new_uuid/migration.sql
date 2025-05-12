/*
  Warnings:

  - You are about to drop the column `systemUuid` on the `LabUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[systemUserUuid]` on the table `LabUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `systemUserUuid` to the `LabUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LabUser_systemUuid_key";

-- AlterTable
ALTER TABLE "LabUser" DROP COLUMN "systemUuid",
ADD COLUMN     "systemUserUuid" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LabUser_systemUserUuid_key" ON "LabUser"("systemUserUuid");
