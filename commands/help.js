import fs from 'fs';

export default {
  name: 'help',
  description: 'List all available commands.',
  execute(interaction) {
    let str = '';
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = import(`./${file}`);
      str += `\`/${command.name}\` - ${command.description} \n`;
    }

    return void interaction.reply({
      content: str,
      ephemeral: true,
    });
  },
};
