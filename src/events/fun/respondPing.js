const fs = require("fs");

const loveMessages = [
  "😍 OH IPEXXX",
  "ilysm bb now roll mudae for me",
  "owo kiss <@954903709689716766>",
  "owo hug <@954903709689716766>",
  "ipexxx",
];

module.exports = {
  name: "messageCreate",
  async execute(message, client, guildID) {
    const Paradis = client.guilds.cache.get(guildID);

    // If the message has bot mention and is not by the bot
    if (message.mentions.has(Paradis.members.me.user) && !message.author.bot) {
      // Emotion Functions List
      async function Respond() {
        // Read ziaMessages.json
        const ziaMessages = JSON.parse(
          fs.readFileSync("./src/data/ziaMessages.json")
        );

        console.log("_ Found", ziaMessages.length, "messages to copy");

        let firstMessage = true;
        // Checks if ziaMessages exists
        if (ziaMessages.length > 1) {
          console.log(
            `== Sending message(s) in: "${message.channel.name}" to "${message.author.tag}" on message id "${message.id}"`
          );

          // Decide a random message to then send
          function sendMessage(randomNumber) {
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

              // If it's the first message, reply
              if (firstMessage) {
                message
                  .reply({
                    content: randomText.toString(),
                    files: randomAttachment,
                    stickers: randomSticker,
                  })
                  .catch((error) => {
                    message.channel.send({
                      content: randomText.toString(),
                      files: randomAttachment,
                      stickers: randomSticker,
                    });
                  });
              } else {
                message.channel.send({
                  content: randomText.toString(),
                  files: randomAttachment,
                  stickers: randomSticker,
                });
              }
            } else {
              console.log(": Looking For Another Message :");
              sendMessage(Math.floor(Math.random() * ziaMessages.length));
            }
          }

          console.log(":: Sending First Message ::");
          sendMessage(Math.floor(Math.random() * ziaMessages.length));
          firstMessage = false;

          setTimeout(() => {
            message.channel.sendTyping();
          }, 1000);

          // 5 second intervals to send the message(s). Randomly decides by 50/50 to send an extra message
          const messageSequence = setInterval(() => {
            // 50/50 chance to continue sending messages
            if (Math.floor(Math.random() * 2) === 1) {
              console.log(": Sending Extra Message :");

              sendMessage(Math.floor(Math.random() * ziaMessages.length));
              setTimeout(() => {
                message.channel.sendTyping();
              }, 1000);
            } else {
              console.log("= Sequence End =");

              clearInterval(messageSequence);
            }
          }, 5 * 1000);
        }
      }

      function Upset() {
        message.reply({
          files: ["https://i.imgur.com/zwi2slS.jpg"],
        });
      }

      function Hi() {
        let hiMessage = "hi";
        let amount = Math.floor(Math.random() * 5);

        for (i = 0; i <= amount; i++) {
          hiMessage = hiMessage + "i";

          if (i === amount) {
            hiMessage =
              message.author.id === "954903709689716766"
                ? `${hiMessage} ipexx`
                : `${hiMessage} ${message.author.username}`;

            message.reply({
              content: hiMessage,
            });
          }
        }
      }

      // Wait 1 to 15 seconds
      setTimeout(() => {
        const chooseEmotion = Math.floor(Math.random() * 12);

        // Only respond with more text if has content, attachments, or a sticker
        if (
          message.content.replace(Paradis.members.me.user, "") ||
          Array.from(message.attachments).length ||
          Array.from(message.stickers).length
        ) {
          message.channel.sendTyping();

          // Has a 10 of 12 chance
          if (chooseEmotion <= 10) {
            // Send a random message
            setTimeout(() => {
              Respond();
            }, 2 * 1000);
          } else if (chooseEmotion === 11) {
            // (Upset)
            Upset();
          }
        } else {
          message.channel.sendTyping();

          // (No Energy)
          setTimeout(() => {
            Hi();
          }, 1 * 1000);
        }
      }, 1 * 1000);
    } else if (message.author.id === "954903709689716766") {
      if (Math.floor(Math.random() * 101) === 1) {
        message.reply(
          loveMessages[Math.floor(Math.random() * loveMessages.length)]
        );
      }
    }
  },
};