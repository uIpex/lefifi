const fs = require("fs");

module.exports = {
  name: "messageDeleteBulk",
  async execute(messages, client, guildID, userID) {
    let ziaMessages = JSON.parse(
      fs.readFileSync("./src/data/ziaMessages.json")
    );
    // Remove the message from the list
    let purgedMessages = Array.from(messages);

    messages.forEach((message) => {
      // If message is not from Zia (or in the array), then remove it from the purged list. Else remove it from ziaMessages. Made as to skip non Zia messages
      if (ziaMessages.filter((msg) => msg.ID === message.id).length === 0) {
        purgedMessages.splice(
          purgedMessages.indexOf(
            purgedMessages.filter((msg) => msg[0] === message.id)[0]
          ),
          1
        );
      } else {
        ziaMessages.splice(
          ziaMessages.indexOf(
            ziaMessages.filter((msg) => msg.ID === message.id)[0]
          ),
          1
        );
      }
    });

    if (purgedMessages.length > 0) {
      ziaMessages[0] = true; // Log that ziaMessages recently updated
      
      // Update ziaMessages.json
      fs.writeFile(
        "./src/data/ziaMessages.json",
        JSON.stringify(ziaMessages, null, 2),
        (err) => {
          if (err) throw err;
          console.log(`! Removed ${purgedMessages.length || 0} messages off of ziaMessages.json !`);
        }
      );
    }
  },
};
