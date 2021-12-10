const {GuildMember} = require('discord.js');
const {QueryType} = require('discord-player');
const playFn = require('../utils/playFn');

module.exports = {
  name: 'play',
  description: 'Play a song in your channel!',
  options: [
    {
      name: 'query',
      type: 3, // 'STRING' Type
      description: 'The song you want to play',
      required: true,
    },
  ],
  execute: playFn(),
};
