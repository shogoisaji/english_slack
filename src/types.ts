export type Bindings = {
  DB: D1Database;
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;
};

export type WordCard = {
  word: string;
  translate: string;
  example: string;
  exampleTranslate: string;
};
