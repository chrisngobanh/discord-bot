import { useMainPlayer } from 'discord-player';
import { isInVoiceChannel } from './voicechannel.js';

export default (options = {}) => {
  const { shouldPlayNext } = options;

  return async (interaction) => {
    try {
      const inVoiceChannel = isInVoiceChannel(interaction);

      if (!inVoiceChannel) {
        return void interaction.reply({
          content: 'You are not in a voice channel!',
          ephemeral: true,
        });
      }

      // console.log(interaction);

      const message = await interaction.channel.send({
        content: `⏱ | Searching...`,
      });

      await interaction.deferReply();

      const player = useMainPlayer();
      const query = interaction.options.getString('query');
      const searchResult = await player.search(query, {
        requestedBy: interaction.user,
      });

      if (!searchResult.hasTracks()) return void interaction.followUp({content: 'No results were found!'});
  
      try {
        await player.play(interaction.member.voice.channel.id, searchResult, {
          nodeOptions: {
            metadata: {
                channel: interaction.channel,
                client: interaction.guild?.members.me,
            },
            leaveOnEmptyCooldown: 300000,
            leaveOnEmpty: true,
            leaveOnEnd: false,
            bufferingTimeout: 0,
            volume: 10,
          },
        });

        if (searchResult.playlist) {
          interaction.followUp({
            embeds: [
              {
                description: `Queued: ${searchResult.tracks.length} tracks [<@!${interaction.user.id}>]`,
                color: 0x607d8b,
              },
            ],
          });
        } else {
          const track = searchResult.tracks[0];

          await interaction.followUp({
            embeds: [
              {
                description: `Queued: [${track.title}](${track.url}) [<@!${interaction.user.id}>]`,
                color: 0x607d8b,
              },
            ],
          });
        }

        message.delete();
      } catch (error) {
          await interaction.editReply({
              content: 'An error has occurred!',
          });
          return console.log(error);
      }
    } catch (error) {
      await interaction.reply({
          content: 'There was an error trying to execute that command: ' + error.message,
      });
    }
  }
};
