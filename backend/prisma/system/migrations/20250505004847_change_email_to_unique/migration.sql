/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `SystemUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");
