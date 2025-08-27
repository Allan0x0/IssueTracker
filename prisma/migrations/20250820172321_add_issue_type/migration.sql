/*
  Warnings:

  - Added the required column `issueTypeId` to the `Issue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Issue` ADD COLUMN `issueTypeId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `IssueType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_issueTypeId_fkey` FOREIGN KEY (`issueTypeId`) REFERENCES `IssueType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
