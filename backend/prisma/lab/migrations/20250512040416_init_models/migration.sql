-- CreateTable
CREATE TABLE "LabUser" (
    "id" SERIAL NOT NULL,
    "systemUserUuid" UUID NOT NULL,
    "roleId" INTEGER,

    CONSTRAINT "LabUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabUser_systemUserUuid_key" ON "LabUser"("systemUserUuid");

-- AddForeignKey
ALTER TABLE "LabUser" ADD CONSTRAINT "LabUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
