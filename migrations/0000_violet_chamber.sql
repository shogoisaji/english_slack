CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`translate` text NOT NULL,
	`example` text,
	`example_translate` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
