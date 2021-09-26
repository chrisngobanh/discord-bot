const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const {Player} = require('discord-player');

require('dotenv').config();

const token = process.env.BOT_TOKEN;

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

console.log(client.commands);

const player = new Player(client);

player.on('error', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on('connectionError', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
  queue.metadata.send(`❌ | Error playing **${queue.current.title}**, skipping track...`);
  queue.skip();
  queue.play();
});

player.on('trackStart', async (queue, track) => {
  const message = await queue.metadata.send({
    embeds: [
      {
        author: { name: '▶ | Started Playing', iconURL: client.user.avatarURL() },
        title: track.title,
        description: `Requested by: <@!${track.requestedBy.id}>`,
        thumbnail: { url: track.thumbnail },
        url: track.url,
        footer: { text: `In 🔊 ${queue.connection.channel.name}` },
        color: 0x607d8b,
      },
    ],
  });

  track.message = message;
  client.user.setStatus('online');
  client.user.setActivity(track.title, { type: 'PLAYING', url: track.url });
});

player.on('trackEnd', (queue, track) => {
  if (track.message) {
    track.message.delete();
  }
});

player.on('botDisconnect', queue => {
  queue.metadata.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
});

player.on('channelEmpty', queue => {
  queue.metadata.send('❌ | Nobody is in the voice channel, leaving...');
});

player.on('queueEnd', queue => {
  client.user.setStatus('idle');
  client.user.setActivity();
});

client.once('ready', async () => {
  console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('shardDisconnect', () => {
  console.log('Disconnect!');
});

client.on('voiceStateUpdate', async (before, after) => {
  const { channel, member } = after;

  if (member?.user?.id === client?.user?.id && !channel) {
    client.user.setStatus('idle');
    client.user.setActivity();
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
    await message.guild.commands
      .set(client.commands)
      .then(() => {
        message.reply('Deployed!');
      })
      .catch(err => {
        message.reply('Could not deploy commands! Make sure the bot has the application.commands permission!');
        console.error(err);
      });
  }
});

client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    if (interaction.commandName == 'userinfo') {
      command.execute(interaction, client);
    } else {
      command.execute(interaction, player);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});

client.login(token);
