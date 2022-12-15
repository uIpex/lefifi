const fs = require("fs");

// Data Files
const settings = JSON.parse(fs.readFileSync("./src/data/settings.json")), // Settings (IDs & such)
{ server, user } = settings,
topics = JSON.parse(fs.readFileSync("./src/data/topics.json")); // Topics (Keywords & IDs)

let greetAnew; // Message collector to greet when a new person joins the convo

const loveMessages = [
  "😍 OH IPEXXX",
  "ilysm bb now roll mudae for me",
  "owo kiss <@954903709689716766>",
  "owo hug <@954903709689716766>",
  "ipexxx",
];

// Chance Percentages
const chances = {
  loveMessages: [400, 1], // x out of y chances
  chooseEmotion: 12, // chances
  extraMessages: 50, // percent
  readSequence: 40 // percent
}

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    const Paradis = client.guilds.cache.get(server.guildID),
    Zia = await Paradis.members.fetch(user.userID.main);

    // In DMs, has bot mention, or has a real Zia mention with a low chance of it working~ Anddd, is not by the bot
    if ((message.channel.isDMBased() ||
      message.mentions.has(client.user) ||
      (message.mentions.has(Zia) && Math.floor(Math.random() * 10) === 0)) && 
      !message.author.bot) {
      
      // Emotion Functions List

      const userEmotions = JSON.parse(fs.readFileSync("./src/data/userEmotions.json")); // userEmotions (User Data)
      async function Greeting(haveMet) {
        greetAnew && greetAnew.stop(); // End collector to restart again

        if (haveMet) { // List the first three users in the channel for "Have met in a day"
          
          await message.channel.messages.fetch({ limit: 3 }).then(messages => {
            messages.forEach(message => {
              if (message.author.bot) return true;

              userEmotions[message.author.id] = {
                ...userEmotions[message.author.id],
                excited: true, // Has the bot been excited for them yet?
              }
            })
          });

          fs.writeFileSync("./src/data/userEmotions.json", JSON.stringify(userEmotions, null, 2));

        } else { // Wait for a new member to join in on the convo to greet them
          
          const filter = (m) => !m.author.bot;
          greetAnew = message.channel.createMessageCollector({ filter, time: 30000 });
          greetAnew.on("collect", (m) => {
            if (JSON.parse(fs.readFileSync("./src/data/userEmotions.json"))[m.author.id].excited) return;

            Hi(m);
          });

        }
      }

      async function Respond() {
        
        Greeting(true);

        // If the message is related to any category
        const category = topics.aot.keywords.some(keyword => message.content.toLowerCase().includes(keyword)) ? 'aot' : 'general';

        // Read ziaMessages.json on a specific category
        let ziaMessages = Object.entries(JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"))[category]);
        console.log("_ Found", ziaMessages.length, "messages to copy");

        let firstMessage = true;
        let typoWord = []; // Contains the correct word & type of typo
        let messageSent; // Sent bot messages

        if (ziaMessages[0]) { // Checks if ziaMessages exists
          console.log(`== Sending message(s) in: "${message.channel.name}" to "${message.author.tag}" on message "${message.url}"`);

          let strayText; // Message collector to catch non-executer texts mid bot sequence

          // Returns a random message
          function findMessage(message, readingTexts) {

            // Check if a person was mentioned
            let foundMention = Object.values(topics.people);
            if ((firstMessage || readingTexts) && Math.floor(Math.random() * 2) === 0)

              foundMention.flat().some((keyword) => {
                if (message.content.toLowerCase().includes(keyword)) {
                  console.log('=> Found a mention:', keyword);

                  return (foundMention = foundMention.filter((item) =>
                    item.includes(keyword)))};
              });

            // If there is a people mention, then filter to only texts with their keywords~ Else just don't filter
            const messages = foundMention.length === 1 ? 
              ziaMessages.filter((message) => foundMention.flat().some((name) => name === 'ka' || name === 'stone' ? message[1].content.split(' ').indexOf(name) > -1 :  message[1].content.includes(name))) :
              ziaMessages;
            
            const randomNumber = Math.floor(Math.random() * messages.length);
            return { ziaMessageID: messages[randomNumber][0], ziaMessage: messages[randomNumber][1]}; // Returns a random message
          }
          
          // Decide a random message to then send
          const sendMessage = (newMessage, readingTexts) =>
            new Promise(async (resolve) => {
              
              Greeting();

              // Typing method. Needs to loop since the limit is 10 seconds
              message.channel.sendTyping();
              const typing = setInterval(() => {
                message.channel.sendTyping();
              }, 9999);
              
              const { ziaMessageID, ziaMessage } = findMessage(newMessage, readingTexts);
              let { content, files } = ziaMessage;

              // Leave the sticker out if it's external
              let stickers;
              if (ziaMessage.stickers[0]) {
                const sticker = await client.fetchSticker(
                  ziaMessage.stickers[0].id
                );

                if (sticker.guildId === server[0].guildID)
                  stickers = ziaMessage.stickers;
              }

              // Checks if it's a spoiler (Basically just checking if the source text is from a spoiler channel)
              let hasSpoiler = false;
              let channelsChecked = 0;
              const checkSpoiler = new Promise(resolve => {
                Paradis.channels.cache.forEach(async (channel) => {
                  if (!channel.isTextBased()) return;
                  channelsChecked++; 

                  channel.messages.fetch(ziaMessageID).then(msg => {
                    if (server.spoilerChannels.includes(channel.id)) {
                      console.log('!! Message Is A Spoiler !!');

                      // Format the message to be spoiler tagged if it's not inside the spoiler channel
                      if (newMessage.channelId !== channel.id) {
                        files = [];
                        stickers = null;
                        hasSpoiler = channel.toString();
                      }

                      resolve();
                    } else if (channelsChecked === Paradis.channels.cache.filter(c => {return c.isTextBased()}).size) resolve();
                  }).catch(notFound => {})
                });
              })

              await checkSpoiler;

              // Checks if the random message exists. If not, look for another message
              if (content || files.length > 0 || stickers) {
                const timer = content.replace(/(?:https?|ftp):\/\/[\n\S]+/g,"").length >>= 3; // Checks the length of the text to get time length estimate (Excluding links)

                // If it's meant to be Zia's sleeping hours, then be tired
                const tiredStart = new Date().setHours(0, 0, 0, 0), // 8
                tiredEnd = new Date().setHours(6, 0, 0, 0); // 14

                if (
                  JSON.parse(fs.readFileSync("./src/data/settings.json")).server.tiredStatus &&
                  content &&
                  new Date() > tiredStart && new Date() < tiredEnd
                ) { // Scrambles owns texts to act tired
                  console.log('😴');
                  let letterList = [...content.replace(/[^a-zA-Z ]/g, '')]; // Letter list, excluding the special symbols
                  let newSentence = '';

                  for (let i = content.length - 1; i >= 0; i--) {
                    const letter = Math.floor(Math.random() * (i + 1));

                    newSentence = newSentence + letterList.slice(letter, letter + 1); // Creates a new word, appending a random letter in each time
                    letterList.splice(letter, 1); // Removes an available letter to then iterate from

                    if (i === 0) content = newSentence.replace(/\s{2,}/g, ' '); // Remove double spaces as well
                  }
                } else { // Make a typo. Skip if there's only one word
                  if (content.indexOf(' ') !== -1 && Math.floor(Math.random() * 20) === 0) {
                    const word = content.split(' ').at(-1); // Takes the last word

                    // If the word is less than 4 letters, or if it's a link, then only remove the whole word. Else can be any of the 3 types
                    const decideType = word.length <= 4 || word.match(/(?:https?|ftp):\/\/[\n\S]+/g) ? 
                      2 : word.length > 4 && Math.floor(Math.random() * 3);

                    typoWord.push(hasSpoiler ? word.replaceAll('||', '') : word, decideType, hasSpoiler); // Log the typo
                    console.log('Typo:', typoWord);

                    let newWord = ''; // The typo

                    if (decideType === 1) newWord = word.slice(0, word.length / 2) // Unfinished word
                    else if (decideType === 0) { // Random letter index

                      let letterList = [...word];

                      for (let i = word.length - 1; i >= 0; i--) {
                        const letter = Math.floor(Math.random() * (i + 1));

                        newWord = newWord + letterList.slice(letter, letter + 1); // Creates a new word, appending a random letter in each time
                        letterList.splice(letter, 1); // Removes an available letter to then iterate from
                      }
                    }

                    content = `${content.substring(0, content.lastIndexOf(' '))} ${newWord}`; // If the type was 2, then just leave the word out from the sentence
                  }
                }

                // If it's a spoiler, then format it
                if (content && hasSpoiler) content = `${hasSpoiler} message ‼️ ||${content.replaceAll('||', '')}||`;

                const messageObject = {
                  content: content,
                  files: files,
                  stickers: stickers,
                };

                console.log(
                  timer,
                  hasSpoiler ? '< SPOILER BLOCKED >' : content || null, '\n' +
                  `Attachments: ${files.map((msg) => msg.attachment + " ")}\n` +
                  `Sticker:`, stickers ? `${stickers[0].name}:${stickers[0].id}\n` : '\n'
                );

                setTimeout(async () => {
                  clearInterval(typing);
                  
                  const messageReply = newMessage.reference && await newMessage.fetchReference();
                  const hasReference = messageReply && messageReply.author.id !== client.user.id;

                  // If it's the first message & it's bigger than 3 characters then, reply
                  if ((timer > 3 || (hasReference && timer > 3)) && firstMessage && !message.channel.isDMBased()) {
                    if (hasReference) newMessage = messageReply;
                    messageSent = newMessage
                      .reply(messageObject)
                      .then(resolve())
                      .catch((error) => {
                        messageSent = message.channel.send(messageObject).then(resolve());
                      });
                  } else messageSent = message.channel.send(messageObject).then(resolve());

                  firstMessage = false;
                  strayText && strayText.stop(); // Stop listening to stray texts since sequence is over
                }, timer * 1000);
              } else {
                console.log(": Looking For Another Message :");
                sendMessage(newMessage);
              }
            });

          // Method to respond
          function messageSequence(newMessage, readingTexts) {
            setTimeout(async () => {
              if (typoWord[0]) { // Did the bot make any typos?
                console.log(":! Fixing a Typo !:");

                const isntSpoiler = !typoWord[0].includes('||') && typoWord[2] === false; // Is the typo not apart of a spoiler message
                const isEmoji = /\p{Extended_Pictographic}/u.test(typoWord[0]); // Is it a emoji
                const randomDecision = Math.floor(Math.random() * 3) === 0 && typoWord[1] < 2; // Randomly decide if it isn't a full word gone

                if ( isntSpoiler && (isEmoji || randomDecision) ) {

                  message.channel.send(typoWord[0]);

                } else {
                  let correctSentence; // New corrected sentence
                  let m = await messageSent;
                  if (typoWord[1] === 2) { // Add the missing word

                    // If it's a spoiler, remove the current spoiler tags to replace with new ones
                    let spoilerText = m.content.slice(0, m.content.lastIndexOf('||')); // kms
                    correctSentence = `${typoWord[2] !== false && m.content.endsWith('||') ? spoilerText.slice(0, spoilerText.lastIndexOf(' ')) : m.content} ${typoWord[0]}`; 

                  } else { // Takes the last word of the message sent, and replace it with the correct version

                    correctSentence = `${m.content.substring(0, m.content.lastIndexOf(' '))} ${typoWord[0]}`;
                    
                  }

                  if (typoWord[2] !== false) correctSentence = correctSentence + '||'; // Add spoiler tag if it's a spoiler

                  m.edit(correctSentence).catch(deleted => {});
                }

                typoWord = []; // Unlog the typo
                messageSequence(); 
              } else if (firstMessage) { // Is it the first message to send?
                console.log(":: Sending First Message ::");

                await sendMessage(message);
                messageSequence();
              } else {
                // 50/50 chance to continue sending messages
                if (readingTexts || Math.floor(Math.random() * 2) === 1) {
                  console.log(": Sending Extra Message :");

                  if (newMessage && newMessage.reference && !readingTexts) firstMessage = true;
                  await sendMessage(newMessage || message, readingTexts);
                  messageSequence();
                } else {
                  console.log("= Sequence End =");

                  // Respond to a text consecutively if it isn't DMs
                  if (!message.channel.isDMBased()) {
                    // Has a 60% chance to not read the later texts
                    if (Math.floor(Math.random() * 100) > 59) {
                      console.log('! Read text available !');
                      
                      // Wait for a user's response. And skips if the response has a client ping, or the responder isn't the executer)
                      // const originalMessage = message; // original since it overwrites smhsmh
                      let filter = m => m.author.id !== client.user.id;
                      message.channel.awaitMessages({ filter, max: 1, time: 15000 })
                        .then(collected => collected.forEach(m => {
                          if (m.author.id === message.author.id && !m.mentions.has(client.user))
                            messageSequence(m, true);
                        }))
                      
                      // Catch stray texts in between the sequence (that isn't the executer or the bot). If any, then reply to the response
                      filter = m => m.author.id !== message.author.id && m.author.id !== client.user.id;
                      strayText = message.channel.createMessageCollector({ filter, max: 1 });
                      strayText.on("collect", (m) => firstMessage = true);
                    }
                  }
                }
              }
            }, readingTexts ? 1500 : 3000); // If read then responding, make it a shorter time to
          }

          messageSequence(); // Start the responding sequence for the first time
        }
      }

      function Upset() {
        message.reply({
          files: ["https://i.imgur.com/zwi2slS.jpg"],
        });
      }

      function Hi(excited) {
        message.channel.sendTyping();
        message = excited ?? message;

        // Mark as excited if isn't
        if (!userEmotions[message.author.id].excited) {

          userEmotions[message.author.id] = {
            ...userEmotions[message.author.id],
            excited: true, // Has the bot been excited for them yet?
          }

          fs.writeFileSync("./src/data/userEmotions.json", JSON.stringify(userEmotions, null, 2));
        }

        // The base messages
        const hihey = Math.floor(Math.random() * 3) > 0 ? "hi" : "hey";
        let hiMessage = hihey;
        let name = topics.people[message.author.id];

        // How much times it'll add an extra letter
        const hiAmount = Math.floor(Math.random() * 3);
        const iAmount = Math.floor(Math.random() * 4);
        const nickAmount = Math.floor(Math.random() * 3);

        // Looping in the extra hi letters
        for (i = 0; i < iAmount; i++) hiMessage = hiMessage + hiMessage.at(-1);

        // Looping in the extra name letters
        if (name && Math.floor(Math.random() * 10) !== 0) {

          name = name[Math.floor(Math.random() * name.length)];
          for (i = 0; i < nickAmount; i++) name = name + name.at(-1);

        } else name = message.author.username;

        // If a person just entered the convo, then make the hi's so motivated
        if (excited) { // wass planning to make it shorter but wasnt worth my time :sob::sob:
          // Looping in the extra hi's & letters
          if (hihey === 'hi') for (i = 0; i < hiAmount; i++) hiMessage = hiMessage + hihey;
          for (i = 0; i < hiAmount; i++) hiMessage = hiMessage + hiMessage.at(-1);

          // Looping in the extra hru's & letters
          let hruMessage = "hru";
          const hruAmount = Math.floor(Math.random() * 2);
          for (i = 0; i < hruAmount; i++) hruMessage = hruMessage + "hru";
          for (i = 0; i < hruAmount + 1; i++) hruMessage = hruMessage + hruMessage.at(-1);

          setTimeout(() =>
            message.channel.send({
              content: Math.floor(Math.random() * 3) > 0 ? hruMessage.toUpperCase() : hruMessage
          }), 4000);
        }

        // Say Hi (Start with either the hi or the name)
        let hello = (() => {
          words = [hiMessage, name];
          position = Math.floor(Math.random() * 2);
          
          return `${words[position === 0 ? 0 : 1]} ${words[position === 1 ? 0 : 1]}${position === 0 ? '' : '!'}`;
        })();

        setTimeout(() =>
          message.reply({
            content: excited && Math.floor(Math.random() * 3) > 0 ? hello.toUpperCase() : hello
        }), 2000);
      }

      setTimeout(() => {
        const chooseEmotion = Math.floor(Math.random() * 12); // Has a 10 of 12 chance to send a random message

        // Only respond with more text if has content, attachments, or a sticker
        if (message.content.replace(Paradis.members.me.user, "") || message.attachments.size || message.stickers.size) {
          
          if (chooseEmotion <= 10) Respond(); // Send a random message
          else if (chooseEmotion === 11) Upset(); 

        } else Hi(); // Hi if no content
      }, 1 * 1000);
    } else if (message.author.id === "954903709689716766") {
      if (Math.floor(Math.random() * 400) === 0)
        message.reply(
          loveMessages[Math.floor(Math.random() * loveMessages.length)]
        );
    }
  },
};