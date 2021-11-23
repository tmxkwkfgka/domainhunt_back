/*
  Warnings:

  - You are about to drop the column `descript` on the `domaininfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `domaininfo` DROP COLUMN `descript`,
    MODIFY `comment` TEXT,
    MODIFY `organicTraffic` TEXT,
    MODIFY `paidTraffic` TEXT,
    MODIFY `topKeyword` TEXT,
    MODIFY `fourKerword` TEXT,
    MODIFY `elevenKeyWord` TEXT,
    MODIFY `twentyOneKeyword` TEXT,
    MODIFY `fiftyOneKeyword` TEXT,
    MODIFY `totalKeyword` TEXT;
