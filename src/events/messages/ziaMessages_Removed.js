const fs = require("fs");

module.exports = {
  name: "messageDelete",
  async execute(message, client, guildID, userID) {
    let ziaMessages = JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"));
    // Remove the message from the list
    if (ziaMessages.filter((msg) => msg.ID === message.id).length === 0) return; // Stop if the message isn't by Zia

    ziaMessages.splice(
      ziaMessages.indexOf(ziaMessages.filter((msg) => msg.ID === message.id)[0]), 1
    );
    
    ziaMessages[0] = true; // Log that ziaMessages recently updated

    // Update ziaMessages.json
    fs.writeFile(
      "./src/data/ziaMessages.json",
      JSON.stringify(ziaMessages, null, 2),
      (err) => {
        if (err) throw err;
        console.log("! Removed a message off of ziaMessages.json !");
      }
    );
  },
};
