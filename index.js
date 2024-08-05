import fs from 'fs';
import Discord from 'discord.js';
import Client from './client/Client.js';
import { Player } from 'discord-player';
import playFile from './utils/playFile.js';
import { YoutubeiExtractor } from "discord-player-youtubei"
import AbortController from 'abort-controller';
import dotEnv from 'dotenv';

global.AbortController = AbortController;

dotEnv.config();

const token = process.env.BOT_TOKEN;

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

commandFiles.forEach(async (file) => {
  const command = (await import(`./commands/${file}`)).default;
  client.commands.set(command.name, command);
});

const player = new Player(client);

player.extractors.register(YoutubeiExtractor, {})

player.extractors.loadDefault((ext) => console.log(ext)).then(r => console.log('Extractors loaded successfully'));

// player.events.on('audioTrackAdd', async (queue, track) => {
//   // queue.metadata.channel.send(`🎶 | Song **${song.title}** added to the queue!`);
//   queue.metadata.channel.send({
//     embeds: [
//       {
//         description: `Queued: [${track.title}](${track.url}) [<@!${track.requestedBy.id}>]`,
//         color: 0x607d8b,
//       },
//     ],
//   });
// });

// player.on('connection', (queue) => {
//     queue.connection.voiceConnection.on('stateChange', (oldState, newState) => {
//       const oldNetworking = Reflect.get(oldState, 'networking');
//       const newNetworking = Reflect.get(newState, 'networking');

//       const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
//         const newUdp = Reflect.get(newNetworkState, 'udp');
//         clearInterval(newUdp?.keepAliveInterval);
//       }

//       oldNetworking?.off('stateChange', networkStateChangeHandler);
//       newNetworking?.on('stateChange', networkStateChangeHandler);
//     });
// });

player.events.on('disconnect', queue => {
  queue.metadata.channel.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
});

player.events.on('emptyChannel', queue => {
  queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
});

player.events.on('emptyQueue', queue => {
  client.user.setStatus('idle');
  client.user.setActivity();
});

player.events.on('error', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

// For debugging
/*player.on('debug', async (message) => {
    console.log(`General player debug event: ${message}`);
});

player.events.on('debug', async (queue, message) => {
    console.log(`Player debug event: ${message}`);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});*/

player.events.on('playerError', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
  queue.metadata.channel.send(`❌ | Error playing track, skipping...`);
  if (queue.current.message) {
    queue.current.message.delete();
  }
  queue.skip();
  queue.play();
});

player.events.on('playerStart', async (queue, track) => {
  const message = await queue.metadata.channel.send({
    embeds: [
      {
        author: { name: '▶ | Started Playing', iconURL: client.user.avatarURL() },
        title: track.title,
        description: `Requested by: <@!${track.requestedBy.id}>`,
        thumbnail: { url: track.thumbnail },
        url: track.url,
        footer: { text: `In 🔊 ${queue.channel.name}` },
        color: 0x607d8b,
      },
    ],
  });

  track.message = message;
  client.user.setStatus('online');
  client.user.setActivity(track.title, { type: 'PLAYING', url: track.url });
});

player.events.on('playerFinish', (queue, track) => {
  if (track.message) {
    track.message.delete();
  }
});

player.events.on('disconnect', queue => {
  queue.metadata.channel.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
});

player.events.on('emptyChannel', queue => {
  queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
});

client.once('ready', async () => {
  const guilds = await client.guilds.fetch();
  guilds.forEach(async (guild) => {
    const _guild = await guild.fetch();

    // Verify the commands on each guild
    const commands = await _guild.commands.fetch();

    commands.forEach(async (command) => {
      const clientCommand = client.commands.get(command.name);

      // If this command no longer exists, delete it
      if (!clientCommand) {
        return await command.delete();
      }

      clientCommand.id = command.id;

      // Update the command if there were any changes
      // TODO: Handle option changes
      if (clientCommand.description !== command.description) {
        return await command.edit(clientCommand);
      }
    });

    client.commands.forEach((clientCommand) => {
      // Check if command has been registered yet
      if (!clientCommand.id) {
        _guild.commands.create(clientCommand);
      }
    });
  });
  console.log('ready!');
});


client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('voiceStateUpdate', async (before, after) => {
  const { channel, member } = after;

  if (member?.user?.id === client?.user?.id && !channel) {
    client.user.setStatus('idle');
    client.user.setActivity();
  }
});

/*
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
  } else if (message.content === '!playfile') {
    // console.log(message.member);
    // message.reply('Cannot play file');
    playFile(message, player); 

  }
});
*/



client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    command.execute(interaction);
  } catch (error) {
      console.error(error);
      await interaction.followUp({
          content: 'There was an error trying to execute that command!',
      });
  }
});

client.login(token);
