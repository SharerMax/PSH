CREATE TABLE `pastes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`language` text DEFAULT 'plaintext' NOT NULL,
	`content` text,
	`content_enc` text,
	`iv` text,
	`salt` text,
	`tag` text,
	`password_hash` text,
	`burn_after_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer
);
