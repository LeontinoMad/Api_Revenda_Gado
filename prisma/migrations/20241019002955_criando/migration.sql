-- CreateTable
CREATE TABLE `racas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `propostas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` VARCHAR(36) NOT NULL,
    `gadoId` INTEGER NOT NULL,
    `descricao` VARCHAR(255) NOT NULL,
    `resposta` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(60) NOT NULL,
    `idade` VARCHAR(30) NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `peso` DECIMAL(10, 3) NOT NULL,
    `informacoes` TEXT NOT NULL,
    `destaque` BOOLEAN NOT NULL DEFAULT true,
    `foto` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sexo` ENUM('MACHO', 'FEMEA') NOT NULL DEFAULT 'MACHO',
    `racasId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` VARCHAR(36) NOT NULL,
    `nome` VARCHAR(60) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `senha` VARCHAR(60) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `propostas` ADD CONSTRAINT `propostas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propostas` ADD CONSTRAINT `propostas_gadoId_fkey` FOREIGN KEY (`gadoId`) REFERENCES `gados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gados` ADD CONSTRAINT `gados_racasId_fkey` FOREIGN KEY (`racasId`) REFERENCES `racas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
