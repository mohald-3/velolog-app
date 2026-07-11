CREATE TABLE `rides` (
	`id` text PRIMARY KEY NOT NULL,
	`bike_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	`distance_m` real NOT NULL,
	`moving_time_ms` integer NOT NULL,
	`paused_time_ms` integer NOT NULL,
	`track_uri` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON UPDATE no action ON DELETE no action
);
