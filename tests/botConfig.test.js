const { getBotConfig } = require('../services/botConfigService');

describe('Bot Config Service', () => {
  it('should load config', async () => {
    const config = await getBotConfig();
    expect(config).toBeDefined();
    expect(config.BOT_ORG_NAME).toBeDefined();
  });
});