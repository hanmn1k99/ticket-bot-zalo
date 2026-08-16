const db = require('../database');

async function getBotConfig() {
  const orgName = await db.getSetting('bot_org_name') || 'trường Meyschool';
  const userRole = await db.getSetting('bot_user_role') || 'Giáo viên';
  const pronounMe = await db.getSetting('bot_pronoun_me') || 'Em';
  const pronounMale = await db.getSetting('bot_pronoun_user_male') || 'Thầy';
  const pronounFemale = await db.getSetting('bot_pronoun_user_female') || 'Cô';
  const pronounDefault = await db.getSetting('bot_pronoun_user_default') || 'Thầy/Cô';
  const environment = await db.getSetting('bot_environment') || 'MÔI TRƯỜNG GIÁO DỤC (trường học)';

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
