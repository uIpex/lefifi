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
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('only one image sadly 😢 thingy didn work')),
    async execute(interaction, client) {
        const Zia = await client.users.fetch('854427265353515039');
        const Ipex = await client.users.fetch('954903709689716766');

        if (interaction.user === Zia || interaction.user === Ipex) {
            const text = interaction.options.getString('text');
            const image = interaction.options.getAttachment("image") ? interaction.options.getAttachment("image").attachment : null;

            process.env[interaction.user === Zia ? 'zias_message' : 'ipexs_message'] = text;
            process.env[interaction.user === Zia ? 'zias_attachment' : 'ipexs_attachment'] = image;
          
            fs.writeFileSync(
              ".env",
              `token=${process.env.token}\n` +
              `zias_message=${interaction.user === Zia ? text : process.env.zias_message}\n` +
              `zias_attachment=${interaction.user === Zia ? image : process.env.zias_attachment}\n` +
              `ipexs_message=${interaction.user === Ipex ? text : process.env.ipexs_message}\n` +
              `ipexs_attachment=${interaction.user === Ipex ? image : process.env.ipexs_attachment}`
            );

            await interaction.reply({
                content: `<:AiTeehee:1044848286588207174> Will be passing on the letter to ${interaction.user.id === '854427265353515039' ? 'Pexxie~' : 'Ziza~'} TYTYY!!`,
                ephemeral: true
            });

            if (interaction.user === Zia) {
                Ipex.send(`${hearts[Math.floor(Math.random() * hearts.length)]} Ziza just wrote a new message~ Quicklyquickly, open ittt <3`)
                    .catch(console.error);
            } else {
                Ipex.send(`${hearts[Math.floor(Math.random() * hearts.length)]} Pexxie just wrote a new message~ Quicklyquickly, open ittt <3`)
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