const fs = require("fs");

let ziaMessages = []; // List to store ALL of Zia's texts, attachments, & stickers (Used to mimic Zia)

const ignoreChannels = ['957629919695876207', '985374396879360091'];

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client, guildID, userID, categoryID) {
    const Paradis = client.guilds.cache.get(guildID);
    const channels = Paradis.channels.cache.filter(c => {
      // Ignore blacklisted channels
      if (ignoreChannels.filter(id => id === c.id).length === 0) {
        // Only search thru text channels and threads in a specific category
        return (c.isTextBased() && c.parentId === categoryID) || 
        (c.isThread() && Paradis.channels.cache.get(c.parentId).parentId === categoryID)};
    });

    let channelsChecked = 0;
    let channelCount = channels.size;

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
                  const msgs = messages.filter((m) => m.author.id === userID || m.author.id === "667361776362323978");

                  // Loop through every message sent by Zia in a channel
                  msgs.forEach((m) => {
                    // If the content, attachments, or a sticker exists within the message
                    if (!(m.content || m.attachments.first() || m.stickers.first())) return;

                    // Skip if the message is a system type
                    if (m.system === true) return;

                    // Adds all of Zia's texts into one array
                    ziaMessages.push({
                      ID: m.id,
                      Content: m.content,
                      Attachments: [...m.attachments.values()],
                      Sticker: [...m.stickers.values()],
                    });
                  });

                  findMessages(thread, messages.last().id); // Loop till channel is dried out
                } else {
                  channelsChecked++; // Finished checking another channel
                  console.log('!!! ', channelsChecked, channelCount, ' !!! ', source.name);
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
        console.log("! ziaMessages.json is now up to date with", ziaMessages.length, "entries !");
      }
    );
  },
};