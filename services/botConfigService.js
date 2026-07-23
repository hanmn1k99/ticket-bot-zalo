const db = require('../database');
const constants = require('../config/constants');

async function getBotConfig() {
  const orgName = await db.getSetting('bot_org_name') || constants.BOT_ORG_NAME;
  const userRole = await db.getSetting('bot_user_role') || constants.BOT_USER_ROLE;
  const pronounMe = await db.getSetting('bot_pronoun_me') || constants.BOT_PRONOUN_ME;
  const pronounMale = await db.getSetting('bot_pronoun_user_male') || constants.BOT_PRONOUN_USER_MALE;
  const pronounFemale = await db.getSetting('bot_pronoun_user_female') || constants.BOT_PRONOUN_USER_FEMALE;
  const pronounDefault = await db.getSetting('bot_pronoun_user_default') || constants.BOT_PRONOUN_USER_DEFAULT;
  const environment = await db.getSetting('bot_environment') || constants.BOT_ENVIRONMENT;

  return {
    BOT_ORG_NAME: orgName,
    BOT_USER_ROLE: userRole,
    BOT_PRONOUN_ME: pronounMe,
    BOT_PRONOUN_USER_MALE: pronounMale,
    BOT_PRONOUN_USER_FEMALE: pronounFemale,
    BOT_PRONOUN_USER_DEFAULT: pronounDefault,
    BOT_ENVIRONMENT: environment
  };
}

module.exports = {
  getBotConfig
};
