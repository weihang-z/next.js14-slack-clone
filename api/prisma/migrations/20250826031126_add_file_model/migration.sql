-- CreateTable
CREATE TABLE "public"."File" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "workspaceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_MessageFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MessageFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_key_key" ON "public"."File"("key");

-- CreateIndex
CREATE INDEX "File_uploadedBy_idx" ON "public"."File"("uploadedBy");

-- CreateIndex
CREATE INDEX "File_workspaceId_idx" ON "public"."File"("workspaceId");

-- CreateIndex
CREATE INDEX "File_createdAt_idx" ON "public"."File"("createdAt");

-- CreateIndex
CREATE INDEX "_MessageFiles_B_index" ON "public"."_MessageFiles"("B");

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MessageFiles" ADD CONSTRAINT "_MessageFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MessageFiles" ADD CONSTRAINT "_MessageFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
