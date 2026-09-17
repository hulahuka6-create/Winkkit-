CREATE TABLE `pushTokens` (
		`id` int AUTO_INCREMENT NOT NULL,
		`userId` int NOT NULL,
		`token` varchar(512) NOT NULL,
		`platform` varchar(20) NOT NULL DEFAULT 'android',
		`isActive` boolean NOT NULL DEFAULT true,
		`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `pushTokens_id` PRIMARY KEY(`id`),
		CONSTRAINT `pushTokens_token_unique` UNIQUE(`token`)
);
