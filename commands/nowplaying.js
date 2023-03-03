import { GuildMember } from 'discord.js';

export default {
  name: 'nowplaying',
  description: 'Get the song that is currently playing.',
  async execute(interaction, player) {
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
      return void interaction.reply({
        content: 'You are not in a voice channel!',
        ephemeral: true,
      });
    }

    if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId
    ) {
      return void interaction.reply({
        content: 'You are not in my voice channel!',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.playing)
      return void interaction.followUp({
        content: '❌ | No music is being played!',
      });
    const progress = queue.createProgressBar();
    
    return void interaction.followUp({
      embeds: [
        {
          author: { name: '🎶 | Now Playing', iconURL: interaction.guild.me.user.avatarURL() },
          title: queue.current.title,
          description: `Requested by: <@!${queue.current.requestedBy.id}>`,
          thumbnail: { url: queue.current.thumbnail },
          url: queue.current.url,
          footer: { text: `In 🔊 ${queue.connection.channel.name}` },
          fields: [
            {
              name: '\u200b',
              value: progress,
            },
          ],
          color: 0x607d8b,
        },
      ],
    });
  },
};
