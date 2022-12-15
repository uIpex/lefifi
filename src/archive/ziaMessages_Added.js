const fs = require("fs");

let ziaMessages = JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"));
const ignoreChannels = ['957629919695876207', '985374396879360091'];

module.exports = {
  name: "messageCreate",
  async execute(message, client, guildID, userID) {
    setTimeout(() => {
      if (message && message.author.id !== userID) return; // Only if the message is by Zia
      if (ignoreChannels.filter(id => id === message.channelId).length !== 0) return; // Ignore blacklisted channels

      function listMessage() {
        // If ziaMessages just recently updated. First check the old cached ziaMessages if it's true (since it's outdated). Then check the current ziaMessages
        if (ziaMessages[0] === true || JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"))[0] === true) {
          // Make ziaMessages up to date
          ziaMessages = JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"));
          ziaMessages[0] = false;
          
          fs.writeFileSync(
            "./src/data/ziaMessages.json",
            JSON.stringify(ziaMessages, null, 2)
          );

          listMessage(); // Restart listMessage function
        } else {
          // Add the new message into the list of Zia's messages
          ziaMessages.push({
            ID: message.id,
            Content: message.content,
            Attachments: [...message.attachments.values()],
            Sticker: [...message.stickers.values()],
          });
  
          // Update ziaMessages.json
          fs.writeFile(
            "./src/data/ziaMessages.json",
            JSON.stringify(ziaMessages, null, 2),
            (err) => {
              if (err) throw err;
              console.log("! Added a new message onto ziaMessages.json !");
            }
          );
        }
      }

      listMessage(); // First time. Add the new message to ziaMessages
    }, 2 * 1000);
  },
};
