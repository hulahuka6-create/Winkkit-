ALTER TABLE `orderItems` ADD `unit` varchar(24) DEFAULT 'piece' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `originalPriceCents` int;--> statement-breakpoint
ALTER TABLE `products` ADD `unit` varchar(24) DEFAULT 'piece' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `sku` varchar(80);--> statement-breakpoint
ALTER TABLE `products` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `isTemporarilyUnavailable` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `openingTime` varchar(5);--> statement-breakpoint
ALTER TABLE `shops` ADD `closingTime` varchar(5);--> statement-breakpoint
ALTER TABLE `shops` ADD `deliveryRadiusKm` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `minimumOrderCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','pending','suspended') DEFAULT 'active' NOT NULL;