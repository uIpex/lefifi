const { Events } = require('discord.js');
const fs = require("fs");

let ziaMessages = JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"));
const ignoreChannels = ['957629919695876207', '985374396879360091'];

module.exports = {
  name: "ready",
  async execute(_, client, guildID, userID, categoryID) {
    
    function filters(message, skip) {
      // Check in ascending order~ 
      //    User, Channel, Category

      // Only if the message is by Zia
      if (!skip && (message && message.author.id !== userID)) return true;

      // Ignore blacklisted channels
      if (ignoreChannels.filter(id => id ===  message.channelId ?? message.id).length !== 0) return true;

      // Ignore if it's outside the main category
      const Paradis = client.guilds.cache.get(guildID);
      const channel = client.channels.cache.get(message.channelId ?? message.id);

      if ((channel.isTextBased() && channel.parentId !== categoryID) ||
      (channel.isThread() && Paradis.channels.cache.get(channel.parentId).parentId !== categoryID)) return true;
    };

    function updateZiaMessages(log) {
      // Update ziaMessages.json

      fs.writeFile(
        "./src/data/ziaMessages.json",
        JSON.stringify(ziaMessages, null, 2),
        (err) => {
          if (err) throw err;
          console.log(log);
        }
      );
    };

    // Update Events :
    //  Used to make ziaMessages up to date ::
    
    // Adds a new message
    client.on(Events.MessageCreate, message => {
      if (filters(message)) return;

      // Add the new message into the list of Zia's messages
      ziaMessages.push({
        ID: message.id,
        Content: message.content,
        Attachments: [...message.attachments.values()],
        Sticker: [...message.stickers.values()],
      });

      updateZiaMessages("! Added a new message onto ziaMessages.json !");
    });

    // Edits an old message
    client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
      if (filters(newMessage)) return;

      const ziaMessage = ziaMessages.filter((c) => c.ID === newMessage.id)[0];
      if (!ziaMessage) return; // If the message isn't in ziaMessages

      // Checks if either the content, or attachment has been updated
      if (ziaMessage.Content !== newMessage.content) {

        // Update the old content for the new one
        ziaMessage.Content = newMessage.content;

      } else if (ziaMessage.Attachments !== newMessage.attachments) {

        // Remove the deleted attachment
        const attachments = [...newMessage.attachments.values()];

        // Loop thru all old attachments to check which one is missing from the new one
        ziaMessage.Attachments.forEach((element) => {

          if (attachments.filter((a) => a.id === element.id).length === 0)
            ziaMessage.Attachments.splice(
              ziaMessage.Attachments.indexOf(element), 1
            );

        });
      }

      updateZiaMessages("! Edited a message from ziaMessages.json !");
    });

    // Deletes a message
    client.on(Events.MessageDelete, message => {
      if (ziaMessages.filter((msg) => msg.ID === message.id).length === 0) return;

      if (filters(message, true)) return;

      ziaMessages.splice(
        ziaMessages.indexOf(ziaMessages.filter((msg) => msg.ID === message.id)[0]), 1
      );

      updateZiaMessages("! Removed a message off of ziaMessages.json !");
    });

    // Deletes multiple messages
    client.on(Events.MessageBulkDelete, (messages, channel) => {
      // [...messages.values()][0]
      if (filters(channel, true)) return;

      // Remove the message from the list
      let purgedMessages = Array.from(messages);

      messages.forEach((message) => {
        // If message is not from Zia (or in the array), then remove it from the purged list. Else remove it from ziaMessages. Made as to skip non Zia messages
        if (ziaMessages.filter((msg) => msg.ID === message.id).length === 0) 
          purgedMessages.splice(
            purgedMessages.indexOf(
              purgedMessages.filter((msg) => msg[0] === message.id)[0]
            ), 1
          );
        else 
          ziaMessages.splice(
            ziaMessages.indexOf(
              ziaMessages.filter((msg) => msg.ID === message.id)[0]
            ), 1
          );
      });

      if (purgedMessages.length > 0) updateZiaMessages(`! Removed ${purgedMessages.length || 0} messages off of ziaMessages.json !`);
    });

  },
};
