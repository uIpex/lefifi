const fs = require("fs");

let ziaMessages = [false]; // List to store ALL of Zia's texts, attachments, & stickers (Used to mimic Zia)

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client, guildID, userID) {
    const Paradis = client.guilds.cache.get(guildID);

    const gatherMessages = new Promise((resolve) => {
      let channelCount = 0;
      Paradis.channels.cache.forEach(async (channel) => {
        if (!(channel.type === 0 || channel.type === 11)) return; // Only search thru text channels and threads
        // Make the bot only available on one certain category
        if (
          channel.parentId == "961351829172670504" ||
          (channel.type === 11 &&
            client.channels.cache.get(channel.parentId).parentId ==
              "961351829172670504")
        ) {
          if (channel.id === "957629919695876207") return;
          // Takes EVERY single message from Zia of each channel
          function findMessages(messageBefore) {
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
                    console.log(ziaMessages.length);
                  });

                  findMessages(messages.last().id); // Loop till channel is dried out
                } else {
                  channelCount++; // +1 the counter
                  // End once it's the last channel
                  if (
                    channelCount ===
                    Paradis.channels.cache.filter(
                      (c) =>
                        ((c.type === 0 || c.type === 11) &&
                          c.parentId == "961351829172670504") ||
                        (c.type === 11 &&
                          Paradis.channels.cache.get(c.parentId).parentId ==
                            "961351829172670504")
                    ).size
                  ) resolve();
                }
              });
          }
          // Run findMessages function for the first time
          findMessages();
        }
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
