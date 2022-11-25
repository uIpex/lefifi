const fs = require("fs");

module.exports = {
  name: "messageUpdate",
  async execute(oldMessage, newMessage, client, guildID, userID) {
    if (newMessage && newMessage.author.id !== userID) return; // Only if the message is by Zia
    
    let ziaMessages = JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"));
    const ziaMessage = ziaMessages.filter((c) => c.ID === oldMessage.id)[0];

    // Checks if either the content, or attachment has been updated
    // console.log(ziaMessage);
    if (ziaMessage.Content !== newMessage.content) {
      // Update the old content for the new one
      // console.log("ziaMessages.Content updated:", newMessage.content);

      ziaMessage.Content = newMessage.content;
    } else if (ziaMessage.Attachments !== newMessage.attachments) {
      // Remove the deleted attachment
      const attachments = [...newMessage.attachments.values()];

      // Loop thru all old attachments to check which one is missing from the new one
      ziaMessage.Attachments.forEach((element) => {
        if (attachments.filter((a) => a.id === element.id).length === 0) {
          // console.log(`ziaMessages.Attachments updated: Removed ${element.name}`);

          ziaMessage.Attachments.splice(
            ziaMessage.Attachments.indexOf(element), 1
          );
        }
      });
    }

    ziaMessages[0] = true; // Log that ziaMessages recently updated

    // Update ziaMessages.json
    fs.writeFile(
      "./src/data/ziaMessages.json",
      JSON.stringify(ziaMessages, null, 2),
      (err) => {
        if (err) throw err;
        console.log("! Edited a message from ziaMessages.json !");
      }
    );
  },
};
