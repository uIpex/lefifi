const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('secret')
        .setDescription('🤭')
        .addBooleanOption(option =>
            option.setName('self')
                .setDescription('See your own secret or not')),
    async execute(interaction, client) {
        if (interaction.user.id === '854427265353515039' || interaction.user.id === '954903709689716766') {
            
            await interaction.reply({
                content: interaction.user.id === '854427265353515039' ? 
                    interaction.options.getBoolean('self') ? process.env.zias_message : process.env.ipexs_message : 
                    interaction.options.getBoolean('self') ? process.env.ipexs_message : process.env.zias_message,
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