const fs = require("fs");

// Data Files
const settings = JSON.parse(fs.readFileSync("./src/data/settings.json")), // Settings (IDs & such)
{ server, user } = settings,
topics = JSON.parse(fs.readFileSync("./src/data/topics.json")); // Topics (Keywords & IDs)

let messageTiming = JSON.parse(
  fs.readFileSync("./src/data/messageTiming.json")
);

let latestMessages = []; // List to store most of the first latest messages of each channel (Used to either send or reply to a message on a certain channel)

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client) {
    const Paradis = client.guilds.cache.get(server.guildID);

    function mimicZia() {
      if (messageTiming.amountSent !== 2) { // If messages hit the max amount to send, then stop

        let timer;

        if (messageTiming.timer === 0) { // If past sequence finished from earlier, make a new one
          // Get the current date, and then the date tomorrow
          const timeStarted = new Date(),
          timeTomorrow = new Date();
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
          new Date(new Date(messageTiming.timeStarted).getTime() + messageTiming.timer).toLocaleString()
        ); // Hours left
        setTimeout(async () => {
          console.log("\n!! Gathering Latest Messages !!");
          // Lists latestMessages stuffs
          const gatherLatests = new Promise((resolve) => {
            const channels = Paradis.channels.cache.filter((c) => {
              // Only search thru text channels and threads in a specific category
              return c.isTextBased() && server.categoryID.main === c.parentId;
            });

            let channelCount = 0;
            // Takes both the channel id and message id of the latest message of each channel
            channels.forEach(async (channel) => {
              await channel.messages
                .fetch({ limit: 1 })
                .then((message) => {
                  message = message.first();
                  
                  latestMessages.push({
                    channelID: channel.id,
                    messageID: !message.system ? message.author.id !== client.user.id ? message.id : null : null, // Null if it is a system message or Zia bot message
                  });
                });

              channelCount++; // Finished checking one channel
              if (channelCount === channels.size) resolve(); // End once it has looked through all channels
            });
          });

          await gatherLatests; // Wait till it's gathered all of the latest messages, then continue

          // Randomly gets the 'latestMessage' to possibly respond to, and the 'latestChannel' to send the message in
          const latestMessage = latestMessages[Math.floor(Math.random() * latestMessages.length)];
          const latestChannel = client.channels.cache.get(latestMessage.channelID);

          // Read ziaMessages.json
          const ziaMessages = Object.entries(JSON.parse(fs.readFileSync("./src/data/ziaMessages.json"))
            [Object.values(topics.aot.channels).includes(latestChannel.id) ? "aot" : "general"]);
            
          console.log(
            "_ Found",
            ziaMessages.length,
            "messages to copy -",
            latestMessages.length,
            "channels/messages to send to"
          );

          console.log(`== Sending message(s) in: "${latestChannel.name}"`);

          let firstMessage = true;
          let typoWord = []; // Contains the correct word & type of typo
          let messageSent; // Sent bot messages

          // Decide a random message to then send
          const sendMessage = () =>
            new Promise(async (resolve) => {
              
              // Typing method. Needs to loop since the limit is 10 seconds
              latestChannel.sendTyping();
              const typing = setInterval(() => {
                latestChannel.sendTyping();
              }, 9999);
              
              const randomNumber = Math.floor(Math.random() * ziaMessages.length);

              const ziaMessageID = ziaMessages[randomNumber][0],
              ziaMessage = ziaMessages[randomNumber][1];
              let { content, files } = ziaMessage;

              // Leave the sticker out if it's external
              let stickers;
              if (ziaMessage.stickers[0]) {
                const sticker = await client.fetchSticker(
                  ziaMessage.stickers[0].id
                );

                if (sticker.guildId === guildID) 
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
                      if (latestChannel.id !== channel.id) {
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

                // Gets the reply message. Checks if the message to reply to, 'latestMessage', exists. If not then skip
                let replyTo;
                if (latestMessage.messageID) {
                  replyTo = await latestChannel.messages
                    .fetch(latestMessage.messageID);
                }

                console.log(
                  timer,
                  hasSpoiler ? '< SPOILER BLOCKED >' : content || null, '\n' +
                  `Attachments: ${files.map((msg) => msg.attachment + " ")}\n` +
                  `Sticker:`, stickers ? `${stickers[0].name}:${stickers[0].id}\n` : '\n'
                );

                setTimeout(() => {
                  clearInterval(typing);

                  // Randomly decides if to reply or not:
                  if (timer > 3 && replyTo && firstMessage && Math.floor(Math.random() * 6) < 2) {
                    messageSent = replyTo
                      .reply(messageObject)
                      .then(resolve())
                      .catch((error) => {
                        latestChannel.send(messageObject).then(resolve());
                      });
                  } else messageSent = latestChannel.send(messageObject).then(resolve());

                  firstMessage = false;
                }, timer * 1000);
              } else {
                console.log(": Looking For Another Message :");
                sendMessage();
              }
            });

          // 5 second intervals to send the message(s). Randomly decides by 50/50 to send an extra message
          function messageSequence() {
            setTimeout(async () => {
              if (typoWord[0]) { // Did the bot make any typos?
                console.log(":! Fixing a Typo !:");
                
                const isntSpoiler = !typoWord[0].includes('||') && typoWord[2] === false; // Is the typo not apart of a spoiler message
                const isEmoji = /\p{Extended_Pictographic}/u.test(typoWord[0]); // Is it a emoji
                const randomDecision = Math.floor(Math.random() * 3) === 0 && typoWord[1] < 2; // Randomly decide if it isn't a full word gone

                // Send typo as a new text if it's an emoji, or if the type isn't a full word gone
                if ( isntSpoiler && (isEmoji || randomDecision) ) {
  
                  latestChannel.send(typoWord[0]);
  
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
  
                await sendMessage();
                messageSequence();
              } else {
                // 50/50 chance to continue sending messages
                if (Math.floor(Math.random() * 2) === 1) {
                  console.log(": Sending Extra Message :");
  
                  await sendMessage();
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
            }, 3000);
          }

          messageSequence();
        }, timer);
      } else {
        // Wait until the next day to continue sending messages
        const timeStarted = new Date();
        const timeTomorrow = Date.parse(messageTiming.timeTomorrow);

        console.log(
          (timeTomorrow - timeStarted) / 3600000,
          "hour(s) left till reset"
        ); // Hours left
        setTimeout(async () => {
          // Reset messageTiming.json for next time
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

          let userData = {};
          await Paradis.members.fetch().then((members) =>
            members.forEach((member) => {
              // if (member.user.bot) return;

              userData[member.user.id] = {
                excited: false, // Has the bot been excited for them yet?
                upset: 0, // How upset are they with them?
              };
            })
          );
          fs.writeFileSync(
            "./src/data/userEmotions.json",
            JSON.stringify(userData, null, 2)
          );

          mimicZia();
        }, timeTomorrow - timeStarted); // Miliseconds left till the next day~ Instant when it's already the "next day"
      }
    }

    // Start it for the first time
    mimicZia();
  },
};
