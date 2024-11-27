-- AlterTable
ALTER TABLE `gados` ADD COLUMN `adminId` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `fotos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(30) NOT NULL,
    `codigoFoto` LONGTEXT NOT NULL,
    `gadoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(60) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `senha` VARCHAR(60) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gados` ADD CONSTRAINT `gados_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fotos` ADD CONSTRAINT `fotos_gadoId_fkey` FOREIGN KEY (`gadoId`) REFERENCES `gados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
