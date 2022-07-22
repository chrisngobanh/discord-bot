import { Client, Collection } from 'discord.js';
import { GatewayIntentBits } from 'discord-api-types/v10';

export default class extends Client {
  constructor(config) {
    super({
      intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds],
    });

    this.commands = new Collection();

    this.config = config;
  }
};
