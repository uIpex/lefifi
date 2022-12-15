const fs = require("fs");

let ziaMessages = [false]; // List to store ALL of Zia's texts, attachments, & stickers (Used to mimic Zia)

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client, guildID, userID) {
    const Paradis = client.guilds.cache.get(guildID);

    const gatherMessages = new Promise((resolve) => {
      let channelsChecked = 1;
      let channels = Paradis.channels.cache.filter(
        (c) =>
          ((c.isTextBased() || c.isThread()) &&
            c.parentId == "961351829172670504") ||
          (c.isThread() && Paradis.channels.cache.get(c.parentId).parentId == "961351829172670504"));
      
      let channelCount = channels.size;
      channels.forEach(async (channel) => {
        if (channel.isThread()) return;
        let archivedThreads = await channel.threads.fetchArchived();
        console.log(archivedThreads.threads.size > 0)
        if (archivedThreads.threads.size > 0) channelCount++;
      });
      
      /* Paradis.channels.cache.forEach(async (channel) => {
        if (!(channel.isTextBased() || channel.isThread())) return; // Only search thru text channels and threads
        // Make the bot only available on one certain category
        if (
          channel.parentId === "961351829172670504" ||
          (channel.isThread() &&
            client.channels.cache.get(channel.parentId).parentId ===
              "961351829172670504")
        ) {
          if (channel.id === "957629919695876207") return;
          // console.log(channel.name);

          // Takes EVERY single message from Zia of each channel
          function findMessages(channel, messageBefore) {
            // Starts off as null. 'messageBefore' is the latest message found. Used to search behind it
            channel.messages
              .fetch({
                limit: 100,
                before: messageBefore,
              })
              .then((messages) => {
                // Continue listing Zia's texts till it's taken ALL the messages in a single channel
                if (Array.from(messages).length > 0) {
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

                  findMessages(channel, messages.last().id); // Loop till channel is dried out
                } else {
                  channelsChecked++; // +1 the counter
                  // End once it's the last channel
                  console.log(channelsChecked, channelCount)
                  console.log(Paradis.channels.cache.filter(x => x.isThread()))
                  if (channelsChecked === channelCount) resolve();
                }
              });
          }

          // Run findMessages function for the first time
          findMessages();

          const channelArchives = await channel.threads.fetchArchived();
          if (channelArchives.threads.size > 0) channelArchives.threads.forEach(thread => findMessages(thread));
        }
      }); */
    });

    await gatherMessages;

    console.log('! Updating ziaMessages.json !');
    
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
