PRAGMA foreign_keys=OFF;--> statement-breakpoint
ALTER TABLE `paste_views` RENAME TO `__old_paste_views`;--> statement-breakpoint
DROP INDEX `paste_views_paste_id_idx`;--> statement-breakpoint
CREATE TABLE `__new_pastes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link` text NOT NULL,
	`title` text,
	`language` text DEFAULT 'plaintext' NOT NULL,
	`content` text,
	`content_enc` text,
	`iv` text,
	`salt` text,
	`tag` text,
	`password_hash` text,
	`burn_after_read` integer DEFAULT false NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
INSERT INTO `__new_pastes`("link", "title", "language", "content", "content_enc", "iv", "salt", "tag", "password_hash", "burn_after_read", "user_id", "created_at", "expires_at") SELECT "id", "title", "language", "content", "content_enc", "iv", "salt", "tag", "password_hash", "burn_after_read", "user_id", "created_at", "expires_at" FROM `pastes`;--> statement-breakpoint
DROP TABLE `pastes`;--> statement-breakpoint
ALTER TABLE `__new_pastes` RENAME TO `pastes`;--> statement-breakpoint
CREATE UNIQUE INDEX `pastes_link_unique` ON `pastes` (`link`);--> statement-breakpoint
CREATE INDEX `pastes_user_id_idx` ON `pastes` (`user_id`);--> statement-breakpoint
CREATE TABLE `paste_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paste_id` integer NOT NULL,
	`viewed_at` integer NOT NULL,
	`country` text DEFAULT 'unknown' NOT NULL,
	`ip` text,
	FOREIGN KEY (`paste_id`) REFERENCES `pastes`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `paste_views`("paste_id", "viewed_at", "country", "ip") SELECT p."id", v."viewed_at", v."country", v."ip" FROM `__old_paste_views` v JOIN `pastes` p ON p."link" = v."paste_id";--> statement-breakpoint
DROP TABLE `__old_paste_views`;--> statement-breakpoint
CREATE INDEX `paste_views_paste_id_idx` ON `paste_views` (`paste_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;