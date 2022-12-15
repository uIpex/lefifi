const { Events } = require('discord.js');
const fs = require("fs");

// Data Files
const settings = JSON.parse(fs.readFileSync("./src/data/settings.json")), // Settings (IDs & such)
{ server, user } = settings,
topics = JSON.parse(fs.readFileSync("./src/data/topics.json")); // Topics (Keywords & IDs)

let ziaMessages = JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"));

module.exports = {
  name: "ready",
  async execute(_, client) {
    
    function filters(message, skip) {
      // Check in ascending order~ 
      //    User, Channel, Category

      // Only if the message is by Zia
      if (!skip && (message && (message.system || !Object.values(user.userID).flat().includes(message.author.id)))) return true;

      // Ignore blacklisted channels
      if (server.ignoredChannels && server.ignoredChannels.includes(message.channelId ?? message.id)) return true;

      // Ignore if it's outside the main category
      const Paradis = client.guilds.cache.get(server.guildID),
      categoryID = Object.values(server.categoryID).flat(),
      channel = client.channels.cache.get(message.channelId ?? message.id);

      if ((channel.isTextBased() && !categoryID.includes(channel.parentId)) ||
      (channel.isThread() && !categoryID.includes(Paradis.channels.cache.get(channel.parentId).parentId))) return true;
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
      ziaMessages[Object.values(topics.aot.channels).includes(message.channelId) ? 'aot' : 'general'][message.id] = {
        content: message.content,
        files: [...message.attachments.values()],
        stickers: [...message.stickers.values()],
      }

      updateZiaMessages("! Added a new message onto ziaMessages.json !");
    });

    // Edits an old message
    client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
      if (filters(newMessage)) return;

      const ziaMessage = ziaMessages[Object.values(topics.aot.channels).includes(newMessage.channelId) ? 'aot' : 'general'][newMessage.id];
      if (!ziaMessage) return; // If the message isn't in ziaMessages

      function deepEqual(x, y) { // Didn't make sadly :cry: BUT I DO UNDERSTAND HOW IT WORKS
        const xyz = Object.keys, tx = typeof x, ty = typeof y;
        return x && y && tx === 'object' && tx === ty ? (
          xyz(x).length === xyz(y).length &&
            xyz(x).every(key => deepEqual(x[key], y[key]))
        ) : (x === y);
      }

      // Checks if either the content, or attachment has been updated
      if (ziaMessage.content !== newMessage.content) {

        // Update the old content for the new one
        ziaMessage.content = newMessage.content;
        updateZiaMessages("! Edited a message from ziaMessages.json !");

      } else if (!deepEqual(ziaMessage.files, [...newMessage.attachments.values()])) {

        // Remove the deleted attachment
        const attachments = [...newMessage.attachments.values()];

        // Loop thru all old attachments to check which one is missing from the new one
        ziaMessage.files.forEach((element) => {

          if (attachments.filter((a) => a.id === element.id).length === 0)
            ziaMessage.files.splice(
              ziaMessage.files.indexOf(element), 1
            );

        });

        updateZiaMessages("! Edited a message from ziaMessages.json !");
      }
    });

    // Deletes a message
    client.on(Events.MessageDelete, message => {
      if (!ziaMessages[Object.values(topics.aot.channels).includes(message.channelId) ? 'aot' : 'general'][message.id]) return;

      delete ziaMessages[Object.values(topics.aot.channels).includes(message.channelId) ? 'aot' : 'general'][message.id];

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
        if (!ziaMessages[Object.values(topics.aot.channels).includes(message.channelId) ? 'aot' : 'general'][message.id]) 
          purgedMessages.splice(
            purgedMessages.indexOf(
              purgedMessages.filter((msg) => msg[0] === message.id)[0]
            ), 1
          );
        else 
          delete ziaMessages[Object.values(topics.aot.channels).includes(message.channelId) ? 'aot' : 'general'][message.id];
      });

      if (purgedMessages.length > 0) updateZiaMessages(`! Removed ${purgedMessages.length || 0} messages off of ziaMessages.json !`);
    });

  },
};