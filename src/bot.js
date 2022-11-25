require('dotenv').config();
const { token } = process.env;
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');

const { Guilds, GuildMembers, GuildMessages, MessageContent } = GatewayIntentBits
const client = new Client({ intents: [Guilds, GuildMembers, GuildMessages, MessageContent], partials: [Partials.Message] });
client.commands = new Collection();
client.commandArray = [];

const functionFolders = fs.readdirSync(`./src/functions`)
for (const folder of functionFolders) {
    const functionFiles = fs
        .readdirSync(`./src/functions/${folder}`)
        .filter((file) => file.endsWith('.js'));
    for (const file of functionFiles)
        require(`./functions/${folder}/${file}`)(client, '954971803837677589', '954903709689716766'); // client, Paradis, Zia
}

client.handleEvents();
client.handleCommands();
client.login(token);