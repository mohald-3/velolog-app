CREATE TABLE `maintenance_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`component_id` text NOT NULL,
	`action` text NOT NULL,
	`interval_m` integer NOT NULL,
	`last_performed_at_odometer_m` integer NOT NULL,
	`notes` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON UPDATE no action ON DELETE no action
);
