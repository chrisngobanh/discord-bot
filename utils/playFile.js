import fetch from "node-fetch";
import { GuildMember } from 'discord.js';
import { Track } from 'discord-player';

export default async (message, player) => {
    const { attachments, member, guild, channel } = message;
    try {
        if (!(member instanceof GuildMember) || !member.voice.channel) {
          return void message.reply('You are not in a voice channel!');
        }
    
        if (
          guild.members.me.voice.channelId &&
          member.voice.channelId !== guild.members.me.voice.channelId
        ) {
          return void message.reply( 'You are not in my voice channel!');
        }

        const attachment = attachments.first();

        if (!attachment) {
          return void message.reply('No audio file attached to your message.');
        }
        
        const ytdlOptions = {
          quality: "highest",
          filter: "audioonly",
          highWaterMark: 1 << 25,
          dlChunkSize: 0,
        };
        
        const queue = await player.createQueue(guild, {
          ytdlOptions,
          metadata: channel,
          leaveOnEnd: false,
          bufferingTimeout: 0,
        });
    
        try {
          if (!queue.connection) await queue.connect(member.voice.channel);
        } catch {
          void player.deleteQueue(message.guildId);
          return void message.reply('Could not join your voice channel!');
        }
  
        const followUpText = !queue.playing ? 'Up Next:' : 'Queued';
        const track = new Track(player, {
            title: attachment.name,
            description: `File uploaded by [<@!${member.id}>]`,
            author: member.displayName,
            url: attachment.url,
            thumbnail: member.user.avatarURL(),
            duration: '0:00',
            views: 0,
            requestedBy: member.user,
            source: 'arbitrary',
        });

        track.raw.engine = async () => {
          const res = await fetch(attachment.url);
          return res.body;
        }

        queue.addTrack(track);

        message.reply({
          embeds: [
              {
              description: `${followUpText} [${track.title}](${track.url}) [<@!${member.id}>]`,
              color: 0x607d8b,
              },
          ],
        });

        if (!queue.playing) {
          await queue.play();
          queue.playing = true;
        }
      } catch (error) {
        console.log(error);
        message.reply('There was an error trying to execute that command: ' + error.message);
      }
}
