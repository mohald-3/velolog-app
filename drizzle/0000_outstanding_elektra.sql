CREATE TABLE `bikes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`model` text,
	`year` integer,
	`color` text,
	`frame_size` text,
	`purchase_date` integer,
	`purchase_price` real,
	`currency` text,
	`photo_uri` text,
	`notes` text,
	`starting_odometer_m` integer DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `components` (
	`id` text PRIMARY KEY NOT NULL,
	`bike_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`installed_at_odometer_m` integer NOT NULL,
	`installed_date` integer NOT NULL,
	`expected_lifetime_km` integer,
	`notes` text,
	`is_retired` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON UPDATE no action ON DELETE no action
);
