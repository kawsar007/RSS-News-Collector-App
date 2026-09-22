-- CreateTable
CREATE TABLE `news_sources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'rss',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastFetchedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_sources_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sourceId` INTEGER NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `link` VARCHAR(1000) NOT NULL,
    `imageUrl` VARCHAR(1000) NULL,
    `publishedAt` DATETIME(3) NULL,
    `guid` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `news_sourceId_idx`(`sourceId`),
    INDEX `news_publishedAt_idx`(`publishedAt`),
    UNIQUE INDEX `news_sourceId_guid_key`(`sourceId`, `guid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `news_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
