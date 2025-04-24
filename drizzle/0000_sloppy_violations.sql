CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_text` text NOT NULL,
	`moderated_output` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `swear_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `swear_words_word_unique` ON `swear_words` (`word`);