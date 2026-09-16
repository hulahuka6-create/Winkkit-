CREATE TABLE `platformSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commissionBps` int NOT NULL DEFAULT 1000,
	`platformFeeCents` int NOT NULL DEFAULT 0,
	`defaultDeliveryFeeCents` int NOT NULL DEFAULT 0,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformSettings_id` PRIMARY KEY(`id`)
);
