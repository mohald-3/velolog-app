CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_system` text DEFAULT 'metric' NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`updated_at` integer NOT NULL
);
