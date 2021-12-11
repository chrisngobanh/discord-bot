import { Client, Collection, Intents } from 'discord.js';
export default class extends Client {
  constructor(config) {
    super({
      intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
    });

    this.commands = new Collection();

    this.config = config;
  }
};
