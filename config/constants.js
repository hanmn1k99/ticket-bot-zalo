require('dotenv').config();

module.exports = {
  AI_API_KEY: process.env.AI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_please_change_in_env',
  PORT: process.env.PORT || 3000,
  WEBHOOK_SECRET_TOKEN: process.env.WEBHOOK_SECRET_TOKEN,
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_NAME: process.env.BOT_NAME || '@Bot',
  PUBLIC_URL: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`
};
