const fs = require("fs");

// Data Files
const settings = JSON.parse(fs.readFileSync("./src/data/settings.json")), // Settings (IDs & such)
{ server, user } = settings,
topics = JSON.parse(fs.readFileSync("./src/data/topics.json")); // Topics (Keywords & IDs)

let ziaMessages = {
  general: {},
  aot: {},
}; // List to store ALL of Zia's texts, attachments, & stickers (Used to mimic Zia)

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client) {
    const Paradis = client.guilds.cache.get(server.guildID);
    const categoryID = Object.values(server.categoryID).flat();
    const channels = Paradis.channels.cache.filter(c => {
      // Ignore blacklisted channels
      if (!server.ignoredChannels.includes(c.id)) {
        // Only search thru text channels and threads in a specific category
        return (c.isTextBased() && categoryID.includes(c.parentId)) || 
        (c.isThread() && categoryID.includes(Paradis.channels.cache.get(c.parentId).parentId))};
    });

    let channelCount = channels.size,
    channelsChecked = 0;

    const gatherMessages = new Promise(async (resolve) => {
      channels.forEach(async (channel) => {
          // Takes EVERY single message from Zia of each channel
          function findMessages(thread, messageBefore) {
            let source = thread || channel;
            source.messages
              .fetch({
                limit: 100,
                // Starts off as null. 'messageBefore' is the latest message found. Used to search beyond 100 messages
                before: messageBefore,
              })
              .then((messages) => {
                // Continue listing Zia's texts till it's taken ALL the messages in a single channel
                if (messages.size > 0) {
                  // Filters to only only Zia's texts
                  const msgs = messages.filter((m) => Object.values(user.userID).flat().includes(m.author.id));

                  // Loop through every message sent by Zia in a channel
                  msgs.forEach((m) => {
                    // If the content, attachments, or a sticker exists within the message
                    if (!(m.content || m.attachments.first() || m.stickers.first())) return;

                    // Skip if the message is a system type
                    if (m.system === true) return;

                    // Adds all of Zia's texts into one array. But first checks if it's in a specific channel to be put in a specific category
                    ziaMessages[Object.values(topics.aot.channels).includes(m.channelId) ? 'aot' : 'general'][m.id] = {
                      content: m.content,
                      files: [...m.attachments.values()],
                      stickers: [...m.stickers.values()],
                    }
                  });

                  findMessages(thread, messages.last().id); // Loop till channel is dried out
                } else {
                  channelsChecked++; // Finished checking another channel
                  // console.log('!!! ', channelsChecked, channelCount, ' !!! ', source.name);
                  if (channelsChecked === channelCount) resolve(); // End once it has checked thru all channels
                }
              });
          }

          // Check through text channels and active threads
          findMessages();
          
          // Check through archived threads
          if (channel.isThread()) return;
          const channelArchives = await channel.threads.fetchArchived();
          if (channelArchives.threads.size > 0) channelArchives.threads.forEach(thread => {channelCount++; findMessages(thread);});
      });
    });

    await gatherMessages;
    
    fs.writeFile(
      "./src/data/ziaMessages.json",
      JSON.stringify(ziaMessages, null, 2),
      (err) => {
        if (err) throw err;
        console.log("! ziaMessages.json is now up to date with", Object.entries(ziaMessages.general).length + Object.entries(ziaMessages.aot).length, "entries !");
      }
    );
  },
};