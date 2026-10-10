ALTER TABLE `words` ADD COLUMN `last_posted_at` integer;

CREATE UNIQUE INDEX `words_word_unique` ON `words` (`word`);
