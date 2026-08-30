ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `banned` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- promote the first registered user to admin
UPDATE `users` SET `role` = 'admin' WHERE `id` = (SELECT `id` FROM `users` ORDER BY `created_at` ASC, `rowid` ASC LIMIT 1);