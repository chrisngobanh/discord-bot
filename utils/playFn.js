import { GuildMember } from 'discord.js';
import { QueryType } from 'discord-player';

export default (options = {}) => {
  const { shouldPlayNext } = options;

  return async (interaction, player) => {
    try {
      if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        return void interaction.reply({
          content: 'You are not in a voice channel!',
          ephemeral: true,
        });
      }
  
      if (
        interaction.guild.me.voice.channelId &&
        interaction.member.voice.channelId !== interaction.guild.me.voice.channelId
      ) {
        return void interaction.reply({
          content: 'You are not in my voice channel!',
          ephemeral: true,
        });
      }
  
      const queue = await player.createQueue(interaction.guild, {
        ytdlOptions: {
          quality: "highest",
          filter: "audioonly",
          highWaterMark: 1 << 25,
          dlChunkSize: 0,
        },
        metadata: interaction.channel,
        leaveOnEnd: false,
        bufferingTimeout: 0,
      });
  
      const message = await queue.metadata.send({
        content: `⏱ | Searching...`,
      });
  
  
      await interaction.deferReply();
  
      const query = interaction.options.get('query').value;
      const searchResult = await player
        .search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO,
        })
        .catch(() => {});
      if (!searchResult || !searchResult.tracks.length)
        return void interaction.followUp({content: 'No results were found!'});
  
  
      try {
        if (!queue.connection) await queue.connect(interaction.member.voice.channel);
      } catch {
        void player.deleteQueue(interaction.guildId);
        return void interaction.followUp({
          content: 'Could not join your voice channel!',
        });
      }

      const followUpText = (shouldPlayNext || !queue.playing) ? 'Up Next:' : 'Queued';

      if (searchResult.playlist) {
        if (shouldPlayNext) {
          queue.insert(searchResult.tracks, 0)
        } else {
          queue.addTracks(searchResult.tracks)
        }

        interaction.followUp({
          embeds: [
            {
              description: `${followUpText} ${searchResult.tracks.length} tracks [<@!${interaction.member.id}>]`,
              color: 0x607d8b,
            },
          ],
        });
      } else { 
        const track = searchResult.tracks[0];
        if (shouldPlayNext) {
          queue.insert(track, 0)
        } else {
          queue.addTrack(track);
        }
        interaction.followUp({
          embeds: [
            {
              description: `${followUpText} [${track.title}](${track.url}) [<@!${interaction.member.id}>]`,
              color: 0x607d8b,
            },
          ],
        });
      }
      message.delete();

      if (!queue.playing) {
        await queue.play();
        queue.playing = true;
      }
    } catch (error) {
      console.log(error);
      interaction.followUp({
        content: 'There was an error trying to execute that command: ' + error.message,
      });
    }
  };
}
