/*
  Warnings:

  - You are about to drop the column `labId` on the `SystemUser` table. All the data in the column will be lost.
  - You are about to drop the `SystemUser_Lab` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SystemUser" DROP CONSTRAINT "SystemUser_labId_fkey";

-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "labId";

-- DropTable
DROP TABLE "SystemUser_Lab";

-- CreateTable
CREATE TABLE "_LabToSystemUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LabToSystemUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LabToSystemUser_B_index" ON "_LabToSystemUser"("B");

-- AddForeignKey
ALTER TABLE "_LabToSystemUser" ADD CONSTRAINT "_LabToSystemUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabToSystemUser" ADD CONSTRAINT "_LabToSystemUser_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
