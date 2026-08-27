CREATE TABLE `paste_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paste_id` text NOT NULL,
	`viewed_at` integer NOT NULL,
	`country` text DEFAULT 'unknown' NOT NULL,
	FOREIGN KEY (`paste_id`) REFERENCES `pastes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `paste_views_paste_id_idx` ON `paste_views` (`paste_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
ALTER TABLE `pastes` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `pastes_user_id_idx` ON `pastes` (`user_id`);