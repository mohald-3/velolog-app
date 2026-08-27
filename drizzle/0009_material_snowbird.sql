ALTER TABLE `rides` ADD `elevation_gain_m` real;--> statement-breakpoint
ALTER TABLE `rides` ADD `source` text DEFAULT 'recorded' NOT NULL;