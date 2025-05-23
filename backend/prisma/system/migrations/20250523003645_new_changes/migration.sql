/*
  Warnings:

  - The `phoneNums` column on the `Lab` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[rif]` on the table `Lab` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dir` on table `Lab` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Lab" ALTER COLUMN "dir" SET NOT NULL,
DROP COLUMN "phoneNums",
ADD COLUMN     "phoneNums" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Lab_rif_key" ON "Lab"("rif");
