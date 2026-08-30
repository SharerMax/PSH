CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`paste_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `paste_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paste_id`) REFERENCES `pastes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorites_paste_id_idx` ON `favorites` (`paste_id`);