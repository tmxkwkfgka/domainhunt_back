-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191),

    UNIQUE INDEX `User.email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191),
    `published` BOOLEAN DEFAULT false,
    `authorId` INTEGER,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DomainInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `myPoint` INTEGER,
    `comment` VARCHAR(191),
    `maxTraffic` INTEGER,
    `yearMonth` TEXT,
    `organicTraffic` VARCHAR(191),
    `paidTraffic` VARCHAR(191),
    `topKeyword` VARCHAR(191),
    `fourKerword` VARCHAR(191),
    `elevenKeyWord` VARCHAR(191),
    `twentyOneKeyword` VARCHAR(191),
    `fiftyOneKeyword` VARCHAR(191),
    `totalKeyword` VARCHAR(191),
    `maxYearMonth` VARCHAR(191),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3),
    `shotPath` VARCHAR(191),
    `descript` VARCHAR(191),

    UNIQUE INDEX `DomainInfo.name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
