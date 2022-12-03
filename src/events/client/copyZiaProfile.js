module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember, client, guildID, userID) {
    if (newMember.id !== userID) return;
      const Paradis = client.guilds.cache.get(guildID);

      if (oldMember.user.username !== newMember.user.username)
        client.user.setUsername(newMember.user.username)
          .then(user => console.log('Bot username now changed from', oldMember.user.username, 'to', user.username))
          .catch(console.error);
      
      if (oldMember.nickname !== newMember.nickname)
        Paradis.members.me.setNickname(newMember.nickname)
          .then(user => console.log('Bot nickname now changed from', oldMember.nickname, 'to', user.nickname))
          .catch(console.error);
      
      if (oldMember.user.avatarURL() !== newMember.user.avatarURL()) 
        client.user.setAvatar(newMember.user.avatarURL())
          .then(user => console.log('Bot avatar now changed from', oldMember.user.avatarURL(), 'to', user.avatarURL()))
          .catch(console.error);
  },
};