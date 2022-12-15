const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('secret')
        .setDescription('🤭')
        .addBooleanOption(option =>
            option.setName('self')
                .setDescription('See your own secret or not 😳')),
    async execute(interaction, client) {
        console.log(interaction)
        if (interaction.user.id === '854427265353515039' || interaction.user.id === '954903709689716766') {
            const ziasAttachment = process.env.zias_attachment === 'null' ? [] : [process.env.zias_attachment];
            const ipexsAttachment = process.env.ipexs_attachment === 'null' ? [] : [process.env.ipexs_attachment];

            await interaction.reply({
                content: interaction.user.id === '854427265353515039' ? 
                    interaction.options.getBoolean('self') ? `${process.env.zias_message}` : `${process.env.ipexs_message}` : 
                    interaction.options.getBoolean('self') ? `${process.env.ipexs_message}` : `${process.env.zias_message}`,

                files: interaction.user.id === '854427265353515039' ? 
                    interaction.options.getBoolean('self') ? ziasAttachment : ipexsAttachment : 
                    interaction.options.getBoolean('self') ? ipexsAttachment : ziasAttachment,

                ephemeral: true
            });

        } else {
            await interaction.reply({
                content: '🤫',
                ephemeral: true
            });
        }
    }
}