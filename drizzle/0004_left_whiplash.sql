CREATE TABLE `maintenance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`component_id` text NOT NULL,
	`rule_id` text,
	`action` text NOT NULL,
	`performed_at_odometer_m` integer NOT NULL,
	`performed_date` integer NOT NULL,
	`cost` real,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rule_id`) REFERENCES `maintenance_rules`(`id`) ON UPDATE no action ON DELETE no action
);
