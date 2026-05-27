-- AlterTable
ALTER TABLE "FamilyCircle" ADD COLUMN "joinCode" TEXT NOT NULL DEFAULT '';

-- Generate unique codes for existing circles
UPDATE "FamilyCircle" SET "joinCode" = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4)) WHERE "joinCode" = '';

-- CreateIndex
CREATE UNIQUE INDEX "FamilyCircle_joinCode_key" ON "FamilyCircle"("joinCode");
