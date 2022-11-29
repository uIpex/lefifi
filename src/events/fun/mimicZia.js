const fs = require("fs");

let latestMessages = []; // List to store most of the first latest messages of each channel (Used to either send or reply to a message on a certain channel)

// Read messageTiming.json
let messageTiming = JSON.parse(
  fs.readFileSync("./src/data/messageTiming.json")
);

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client, guildID, userID) {
    const Paradis = client.guilds.cache.get(guildID);

    function mimicZia() {
      // If messages hit the max amount to send, then stop
      if (messageTiming.amountSent !== 2) {
        let timer;
        // If past sequence finished from earlier, make a new one
        if (messageTiming.timer === 0) {
          // Get the current date, and then the date tomorrow
          const timeStarted = new Date();
          const timeTomorrow = new Date();
          timeTomorrow.setHours(24, 0, 0, 0);

          // Get the time between now and tomorrow, and then choose a random time inbetween
          timer = Math.floor(Math.random() * (timeTomorrow - timeStarted));
          // Log it in the messageTiming.json file
          messageTiming = {
            timeStarted: timeStarted,
            timeTomorrow: timeTomorrow,
            timer: timer,
            amountSent: messageTiming.amountSent,
          };

          fs.writeFile(
            "./src/data/messageTiming.json",
            JSON.stringify(messageTiming, null, 2),
            (err) => {
              if (err) throw err;
              console.log("! messageTiming.json is now up to date !");
            }
          );
        } else {
          // Find how much time has passed, and then subtract the timer with it
          timer =
            messageTiming.timer -
            (new Date() - Date.parse(messageTiming.timeStarted));
        }

        console.log(
          timer / 3600000,
          "hour(s) left to continue. Estimation:",
          new Date(
            new Date(messageTiming.timeStarted).getTime() + messageTiming.timer
          ).toLocaleString()
        ); // Hours left
        setTimeout(async () => {
          console.log("\n!! Gathering Messages !!");
          // Lists latestMessages stuffs          
          const gatherMessages = new Promise((resolve) => {
            let channelCount = 0;
            Paradis.channels.cache.forEach(async (channel) => {
              // Only search thru text channels and threads
              if (channel.type === 0 || channel.type === 11) {
                // Make the bot only available on one certain category
                if (
                  channel.parentId == "961351829172670504" ||
                  (channel.type === 11 &&
                    client.channels.cache.get(channel.parentId).parentId ==
                      "961351829172670504")
                ) {
                  // Takes both the channel id and message id of the latest message of each channel
                  channel.messages
                    .fetch({
                      limit: 1,
                    })
                    .then((messages) => {
                      messages.forEach((m) => {
                        // Adds all of the latest messages into one array
                        latestMessages.push({
                          ChannelID: m.channelId,
                          MessageID: !m.system ? m.id : null, // Is it a system message? If not then list the ID. Else null
                        });

                        channelCount++;
                        // End once it's the last channel
                        if (
                          channelCount ===
                          Paradis.channels.cache.filter(
                            (c) =>
                              ((c.type === 0 || c.type === 11) &&
                                c.parentId == "961351829172670504") ||
                              (c.type === 11 &&
                                Paradis.channels.cache.get(c.parentId)
                                  .parentId == "961351829172670504")
                          ).size
                        ) {
                          resolve();
                        }
                      });
                    });
                }
              }
            });
          });

          await gatherMessages; // Wait till it's gathered all of the latest messages, then continue

          // Read ziaMessages.json
          const ziaMessages = JSON.parse(
            fs.readFileSync("./src/data/ziaMessages.json")
          );

          console.log(
            "_ Found",
            ziaMessages.length,
            "messages to copy -",
            latestMessages.length,
            "channels/messages to send to"
          );

          let firstMessage = true;
          // Checks if ziaMessages exists
          if (latestMessages.length > 1) {
            // Randomly gets the latestMessage to possibly respond to. And the 'latestChannel' to send the message in
            const latestMessage =
              latestMessages[Math.floor(Math.random() * latestMessages.length)];
            const latestChannel = client.channels.cache.get(
              latestMessage.ChannelID
            );

            console.log(`== Sending message(s) in: "${latestChannel.name}"`);

            // Gets the reply message. Checks if the message to reply to, 'latestMessage', exists. If not then skip
            let replyTo;
            if (latestMessage.MessageID) {
              replyTo = await latestChannel.messages
                .fetch(latestMessage.MessageID)
                .catch((error) => {});
            }

            // Decide a random message to then send
            async function sendMessage(randomNumber) {
              const randomText = ziaMessages[randomNumber].Content;
              const randomAttachment = ziaMessages[randomNumber].Attachments;
              const randomSticker = ziaMessages[randomNumber].Sticker;

              // Checks if the random message exists. If not, look for another message
              if (
                randomText ||
                randomAttachment.length > 0 ||
                randomSticker.length > 0
              ) {
                console.log(
                  `${randomText || null}\nAttachments: ${randomAttachment.map(
                    (msg) => msg.attachment
                  )}\nSticker:`,
                  randomSticker[0]
                    ? `${randomSticker[0].name}:${randomSticker[0].id}\n`
                    : "\n"
                );
                // Randomly decides if to reply or not:
                if (
                  !replyTo || // If there is no reply, then skip
                  replyTo.author.id ===
                    client.guilds.cache.get(guildID).members.me.user.id || // If reply author is the bot, then don't reply
                  !firstMessage || // Is this the first message..?
                  Math.floor(Math.random() * 6) < 2 // ..If true, randomly decide to reply or not
                ) {
                  latestChannel.send({
                    content: randomText.toString(),
                    files: randomAttachment,
                    stickers: randomSticker,
                  });
                } else {
                  replyTo.reply(randomText.toString()).catch((error) => {
                    latestChannel.send({
                      content: randomText.toString(),
                      files: randomAttachment,
                      stickers: randomSticker,
                    });
                  });
                }
              } else {
                console.log(": Looking For Another Message :");
                sendMessage(Math.floor(Math.random() * ziaMessages.length));
              }
            }

            // 5 second intervals to send the message(s). Randomly decides by 50/50 to send an extra message
            const messageSequence = setInterval(() => {
              // Is it the first message to send?
              if (firstMessage) {
                latestChannel.sendTyping();
                console.log(":: Sending First Message ::");
                sendMessage(Math.floor(Math.random() * ziaMessages.length));
                firstMessage = false;
              } else {
                // 50/50 chance to continue sending messages
                if (Math.floor(Math.random() * 2) === 1) {
                  latestChannel.sendTyping();
                  console.log(": Sending Extra Message :");
                  sendMessage(Math.floor(Math.random() * ziaMessages.length));
                } else {
                  console.log("= Sequence End =");
                  // Reset lists:
                  latestMessages = [];

                  // Remember how much times it ran this sequence:
                  messageTiming = {
                    timeStarted: 0,
                    timeTomorrow: messageTiming.timeTomorrow,
                    timer: 0,
                    amountSent: messageTiming.amountSent + 1,
                  };
                  fs.writeFileSync(
                    "./src/data/messageTiming.json",
                    JSON.stringify(messageTiming, null, 2)
                  );

                  clearInterval(messageSequence);
                  mimicZia();
                }
              }
            }, 5 * 1000);
          }
        }, timer);
      } else {
        // Wait until the next day to continue sending messages
        const timeStarted = new Date();
        const timeTomorrow = Date.parse(messageTiming.timeTomorrow);

        console.log(
          (timeTomorrow - timeStarted) / 3600000,
          "hour(s) left till reset"
        ); // Hours left
        setTimeout(() => {
          // Reset messageTiming.json for next time
          console.log(messageTiming.timeStarted === 0, timeTomorrow - timeStarted > 0)
          messageTiming = {
            timeStarted: 0,
            timeTomorrow: 0,
            timer: 0,
            amountSent:
              messageTiming.timeStarted === 0 || timeTomorrow - timeStarted > 0
                ? 0
                : 1, // amountSent to 0 if the message sequences were over. Else if the timing was a day before, then count the amount to 1.
          };
          fs.writeFileSync(
            "./src/data/messageTiming.json",
            JSON.stringify(messageTiming, null, 2)
          );

          mimicZia();
        }, timeTomorrow - timeStarted); // Miliseconds left till the next day~ Instant when it's already the "next day"
      }
    }

    // Start it for the first time
    mimicZia();
  },
};