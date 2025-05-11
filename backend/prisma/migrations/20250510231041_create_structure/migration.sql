-- CreateTable
CREATE TABLE `colaboradores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matricula` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `colaboradores_matricula_key`(`matricula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `colaboradorId` INTEGER NOT NULL,
    `falta` BOOLEAN NOT NULL DEFAULT false,
    `atrasoMinutos` INTEGER NOT NULL DEFAULT 0,
    `extraMinutos` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `registros_data_idx`(`data`),
    UNIQUE INDEX `registros_data_colaboradorId_key`(`data`, `colaboradorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batidas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registroId` INTEGER NOT NULL,
    `horario` DATETIME(3) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `batidas_registroId_idx`(`registroId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arquivos_processados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `processado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `arquivos_processados_hash_key`(`hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registros` ADD CONSTRAINT `registros_colaboradorId_fkey` FOREIGN KEY (`colaboradorId`) REFERENCES `colaboradores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batidas` ADD CONSTRAINT `batidas_registroId_fkey` FOREIGN KEY (`registroId`) REFERENCES `registros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
