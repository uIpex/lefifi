const fs = require("fs");

let latestMessages = []; // List to store most of the first latest messages of each channel (Used to either send or reply to a message on a certain channel)

// Read messageTiming.json
let messageTiming = JSON.parse(
  fs.readFileSync("./src/data/messageTiming.json")
);

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client, guildID, userID, categoryID) {
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
          const gatherLatests = new Promise((resolve) => {
            const channels = Paradis.channels.cache.filter((c) => {
              // Only search thru text channels and threads in a specific category
              return ((c.isTextBased() && c.parentId === categoryID) ||
              (c.isThread() && Paradis.channels.cache.get(c.parentId).parentId === categoryID));
            });

            let channelCount = 0;
            // Takes both the channel id and message id of the latest message of each channel
            channels.forEach(async (channel) => {
              await channel.messages.fetch(channel.lastMessageId)
                .then(message => {
                  latestMessages.push({
                    ChannelID: channel.id,
                    MessageID: !message.system ? message.id : null, // Is it a system message? If not then list the ID. Else null
                  });
                })
                .catch(system => latestMessages.push({ ChannelID: channel.id, MessageID: null }));

              channelCount++; // Finished checking one channel
              if (channelCount === channels.size) resolve(); // End once it has looked through all channels
            });
          });

          await gatherLatests; // Wait till it's gathered all of the latest messages, then continue

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
            const sendMessage = (randomNumber) =>
              new Promise(async (resolve) => {
                latestChannel.sendTyping();
                const randomText = ziaMessages[randomNumber].Content;
                const randomAttachment = ziaMessages[randomNumber].Attachments;

                // Leave the sticker out if it's external
                let randomSticker;
                if (ziaMessages[randomNumber].Sticker[0]) {
                  const sticker = await client.fetchSticker(ziaMessages[randomNumber].Sticker[0].id);

                  if (sticker.guildId === guildID)
                    randomSticker = ziaMessages[randomNumber].Sticker;
                }

                // Checks if the random message exists. If not, look for another message
                if (randomText || randomAttachment.length > 0 || randomSticker) {
                  console.log(
                    `${randomText || null}\n`,
                    `Attachments: ${randomAttachment.map((msg) => msg.attachment)}\n`,
                    "Sticker:", randomSticker ? `${randomSticker[0].name}:${randomSticker[0].id}\n` : "\n"
                  );

                  setTimeout(() => {
                    // Randomly decides if to reply or not:
                    if (
                      !replyTo || // If there is no reply, then skip
                      replyTo.author.id === client.guilds.cache.get(guildID).members.me.user.id || // If reply author is the bot, then don't reply
                      !firstMessage || // Is this the first message..?
                      Math.floor(Math.random() * 6) < 2 // ..If true, randomly decide to reply or not
                    ) {
                      latestChannel.send({
                        content: randomText,
                        files: randomAttachment,
                        stickers: randomSticker,
                      }).then(resolve());
                    } else {
                      replyTo
                        .reply({
                          content: randomText,
                          files: randomAttachment,
                          stickers: randomSticker,
                        }).then(resolve())
                        .catch((error) => {
                          latestChannel.send({
                            content: randomText,
                            files: randomAttachment,
                            stickers: randomSticker,
                          }).then(resolve());
                        });
                    }
                  }, (randomText.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").length >>= 3) * 1000); // Checks the length of the text to get time estimate (Excluding links)
                } else {
                  console.log(": Looking For Another Message :");
                  sendMessage(Math.floor(Math.random() * ziaMessages.length));
                }
              });

            // 5 second intervals to send the message(s). Randomly decides by 50/50 to send an extra message
            function messageSequence() {
              setTimeout(async () => {
                // Is it the first message to send?
                if (firstMessage) {
                  console.log(":: Sending First Message ::");

                  await sendMessage(Math.floor(Math.random() * ziaMessages.length));
                  firstMessage = false;
                  messageSequence();
                } else {
                  // 50/50 chance to continue sending messages
                  if (Math.floor(Math.random() * 2) === 1) {
                    console.log(": Sending Extra Message :");

                    await sendMessage(Math.floor(Math.random() * ziaMessages.length));
                    messageSequence();
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

                    mimicZia();
                  }
                }
              }, 5000);
            }

            messageSequence();
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
          // console.log(messageTiming.timeStarted === 0, timeTomorrow - timeStarted > 0);
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
