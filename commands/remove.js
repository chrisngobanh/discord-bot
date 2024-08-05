import { useQueue } from 'discord-player';
import { isInVoiceChannel } from '../utils/voicechannel.js';

export default {
  name: 'remove',
  description: 'Remove a song from the queue!',
  options: [
    {
      name: 'number',
      type: 4, // 'INTEGER' Type
      description: 'The queue number you want to remove',
      required: true,
    },
  ],
  async execute(interaction) {
    const inVoiceChannel = isInVoiceChannel(interaction)
    if (!inVoiceChannel) {
        return
    }

    await interaction.deferReply();
    const queue = useQueue(interaction.guild.id);
 
    if (!queue || !queue.isPlaying()) return void interaction.followUp({content: '❌ | No music is being played!'});
    const number = interaction.options.get('number').value - 1;
    if (number > queue.tracks.size)
      return void interaction.followUp({content: '❌ | Track number greater than queue depth!'});
    const removedTrack = queue.node.remove(number);
    return void interaction.followUp({
      content: removedTrack ? `✅ | Removed **${removedTrack}**!` : '❌ | Something went wrong!',
    });
  },
};
