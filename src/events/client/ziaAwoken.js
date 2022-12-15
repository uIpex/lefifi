const fs = require("fs");

// Data Files
const settings = JSON.parse(fs.readFileSync("./src/data/settings.json")), // Settings (IDs & such)
{ server, user } = settings;

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client) {
    const Paradis = client.guilds.cache.get(server.guildID);
    const Bot = Paradis.members.me;

    client.user.setPresence({ status: 'invisible' });

    let userData = {};
    await Paradis.members.fetch().then((members) =>
      members.forEach((member) => {
        if (member.user.bot) return;

        userData[member.user.id] = {
          excited: false, // Has the bot been excited for them yet?
          upset: 0, // How upset are they with them?
        };
      }));
    
    fs.writeFileSync(
      "./src/data/userEmotions.json",
      JSON.stringify(userData, null, 2)
    );

    console.log(`🌺 Better Ziza has woken up! Now online as "${Bot.nickname ?? Bot.user.username}"`)
  },
};