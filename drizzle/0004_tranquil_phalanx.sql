ALTER TABLE `orders` ADD `deliveryAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `clientRequestId` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_clientRequestId_unique` UNIQUE(`clientRequestId`);