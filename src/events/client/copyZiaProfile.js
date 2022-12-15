const { Events } = require('discord.js');
const fs = require("fs");

// Data Files
const settings = JSON.parse(fs.readFileSync("./src/data/settings.json")), // Settings (IDs & such)
{ server, user } = settings;

module.exports = {
  name: "ready",
  async execute(_, client) {

    // Updating the bot's profile with Zia's
    function Nickname(oldUser, newUser) {
      const guild = client.guilds.cache.get(newUser.guild.id);

      if (oldUser.nickname !== newUser.nickname)
        guild.members.me.setNickname(newUser.nickname)
          .then(bot => console.log('🌺 Bot nickname now changed from', oldUser.nickname, 'to', newUser.nickname))
          .catch(console.error);
    }

    function Username(oldUser, newUser) {
      if (oldUser.user.username !== newUser.user.username)
        client.user.setUsername(newUser.user.username)
          .then(bot => console.log('🌺 Bot username now changed from', oldUser.user.username, 'to', newUser.user.username))
          .catch(console.error);
    }

    function Avatar(newUser) {
      if (user.avatar !== newUser.user.avatarURL()) {
        client.user.setAvatar(newUser.user.avatarURL())
          .then(bot => console.log('🌺 Bot avatar now changed to', newUser.user.avatarURL()))
          .catch(console.error);

        user.avatar = newUser.user.avatarURL();

        fs.writeFileSync("./src/data/settings.json",
          JSON.stringify(settings, null, 2)
        );
      }
    }

    // Listen to profile changes from Zia
    client.on(Events.UserUpdate, (oldUser, newUser) => {
      if (newUser.id !== user.userID.main) return;

      Username(oldUser, newUser), Avatar(newUser);
    });

    client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
      if (newMember.id !== user.userID.main) return;

      // Update nickname
      Nickname(oldMember, newMember);
    });

    // Update the bot's profile if it's outdated once it has turned on
    const Paradis = client.guilds.cache.get(server.guildID),
      Bot = Paradis.members.me,
      Zia = await Paradis.members.fetch(user.userID.main).then(aa => {
        Nickname(Bot, Zia), Username(Bot, Zia), Avatar(Zia);
      }).catch(cantFind => console.log("😢 Couldn't update my profile. Zia's not in the server"));
  },
};