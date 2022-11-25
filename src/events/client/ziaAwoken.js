module.exports = {
  name: "ready",
  once: true,
  async execute(_, client, guildID, userID) {
    const Paradis = client.guilds.cache.get(guildID);
    const Bot = Paradis.members.me;
    const Zia = await Paradis.members.fetch(userID);
    
    if (false) {
    // if (Bot.user.username !== Zia.user.username) {
      client.user.setUsername(Zia.user.username)
        .then(user => console.log('Bot username now changed from', Bot.user.username, 'to', user.username))
        .catch(console.error);
    }
    
    if (Bot.nickname !== Zia.nickname) {
      console.log('Bot nickname now changed from', Bot.nickname, 'to', Zia.nickname)
      await Bot.setNickname(Zia.nickname)
    }
    
    if (false) {
    // if (Bot.user.avatarURL() !== Zia.user.avatarURL()) {
      client.user.setAvatar(Zia.user.avatarURL())
        .then(user => console.log('Bot avatar now changed from', Bot.user.avatarURL(), 'to', user.avatarURL()))
        .catch(console.error);
    }

    console.log(`🌺 Better Ziza woken up! Now online as "${Bot.nickname}"`)
  },
};