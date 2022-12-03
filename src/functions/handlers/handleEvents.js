const fs = require("fs");

module.exports = (client, ...info) => {
  client.handleEvents = async () => {
    const eventFolders = fs.readdirSync(`./src/events`);
    for (const folder of eventFolders) {
      const eventFiles = fs
        .readdirSync(`./src/events/${folder}`)
        .filter((file) => file.endsWith(".js"));
      if (folder === "client" || folder === "fun" || folder === "messages")
        for (const file of eventFiles) {
          const event = require(`../../events/${folder}/${file}`);
          if (event.once)
            client.once(event.name, (...args) =>
              event.execute(...args, client, ...info)
            );
          else
            client.on(event.name, (...args) =>
              event.execute(...args, client, ...info)
            );
        }
    }
  };
};
