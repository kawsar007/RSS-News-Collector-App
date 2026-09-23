-- AlterTable
ALTER TABLE `news_sources` ADD COLUMN `consecutiveFailures` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `errorMessage` VARCHAR(500) NULL,
    ADD COLUMN `failedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `news_sources_isActive_idx` ON `news_sources`(`isActive`);
