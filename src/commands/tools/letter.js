require('dotenv').config();

const { SlashCommandBuilder } = require('discord.js');
const fs = require("fs");

const hearts = ['❤️','💗','🫶','💞 ','💝','💓 ','❣️','💜 ','💌','😘 ','🥰' ,'❤️‍🔥 ']

module.exports = {
    data: new SlashCommandBuilder()
        .setName('letter')
        .setDescription('Send a message to a certain someone 😉')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Secret')
                .setRequired(true)),
    async execute(interaction, client) {
        const Zia = await client.users.fetch('854427265353515039');
        const Ipex = await client.users.fetch('954903709689716766');

        if (interaction.user === Zia || interaction.user === Ipex) {
            fs.writeFileSync(
              ".env",
              `token=${process.env.token}\n` +
              `zias_message="${interaction.user === Zia ? interaction.options.getString('text') : process.env.zias_message}"\n` + 
              `ipexs_message="${interaction.user === Ipex ? interaction.options.getString('text') : process.env.ipexs_message}"`
            );

            await interaction.reply({
                content: `<:AiTeehee:1044848286588207174>  Will be passing on the letter to ${interaction.user.id === '854427265353515039' ? 'Pexxie~' : 'Ziza~'} TYTYY!!`,
                // files: ["https://cdn.discordapp.com/emojis/725265535306170420.webp?size=48&quality=lossless"],
                ephemeral: true
            });

            if (interaction.user === Zia) {
                Ipex.send(`${hearts[Math.floor(Math.random() * hearts.length)]} Ziza just wrote a new message~ Quicklyquickly, open ittt <3`)
                    .then(message => console.log(`Sent message: ${message.content}`))
                    .catch(console.error);
            } else {
                Zia.send(`${hearts[Math.floor(Math.random() * hearts.length)]} Pexxie just wrote a new message~ Quicklyquickly, open ittt <3`)
                    .catch(console.error);
            };
        } else {
            console.log(interaction.user.username, 'tried making a letter 🤭');

            await interaction.reply({
                content: '🤫',
                ephemeral: true
            });
        }
    }
}