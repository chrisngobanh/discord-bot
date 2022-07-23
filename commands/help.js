import fs from 'fs';

export default {
  name: 'help',
  description: 'List all available commands.',
  execute: async (interaction) => {
    await interaction.deferReply();
    let str = '';
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
	    const command = (await import(`./${file}`)).default;
      str += `\`/${command.name}\` - ${command.description} \n`;
    }

    return void interaction.followUp({
      content: str,
      ephemeral: true,
    });
  },
};
