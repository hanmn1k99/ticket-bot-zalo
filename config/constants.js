require('dotenv').config();

module.exports = {
  AI_API_KEY: process.env.AI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_please_change_in_env',
  BOT_ORG_NAME: process.env.BOT_ORG_NAME || 'Công ty',
  BOT_USER_ROLE: process.env.BOT_USER_ROLE || 'Anh/Chị',
  BOT_PRONOUN_ME: process.env.BOT_PRONOUN_ME || 'Em',
  BOT_PRONOUN_USER_MALE: process.env.BOT_PRONOUN_USER_MALE || 'Anh',
  BOT_PRONOUN_USER_FEMALE: process.env.BOT_PRONOUN_USER_FEMALE || 'Chị',
  BOT_PRONOUN_USER_DEFAULT: process.env.BOT_PRONOUN_USER_DEFAULT || 'Anh/Chị',
  BOT_ENVIRONMENT: process.env.BOT_ENVIRONMENT || 'MÔI TRƯỜNG CÔNG SỞ / DOANH NGHIỆP',
  PORT: process.env.PORT || 3000,
  WEBHOOK_SECRET_TOKEN: process.env.WEBHOOK_SECRET_TOKEN,
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_NAME: process.env.BOT_NAME || '@Bot',
  PUBLIC_URL: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`
};
