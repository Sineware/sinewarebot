const axios = require("axios");
const translateURL = process.env.TRANSLATE_API + "/translate"
const truncate = require('truncate');

async function detectLanguage(msg) {
    let res = await axios.post(process.env.TRANSLATE_API + "/detect", {
        q: msg,
    });
    return res.data[0].language;
}

async function init(client, cm, ap, nuclient) {
    if(process.env.TRANSLATE_ENABLE !== 'true') {
        console.log("    -> This plugin is disabled.");
        return;
    }
    try {
        client.on("messageReactionAdd", async (reaction, user) => {
            //console.log(reaction.emoji);
            if(reaction.emoji.name === '🇰🇷') {
                let detectedLanguage = await detectLanguage(reaction.message.content);
                let translation = await axios.post(translateURL, {
                    q: reaction.message.content,
                    source: detectedLanguage,
                    target: "ko"
                });
                await nuclient.createReplyMessage(translation.data.translatedText, reaction.message.channel.id, reaction.message.id);
            } else if(reaction.emoji.name === '🇯🇵') {
                let detectedLanguage = await detectLanguage(reaction.message.content);
                let translation = await axios.post(translateURL, {
                    q: reaction.message.content,
                    source: detectedLanguage,
                    target: "ja"
                });
                await nuclient.createReplyMessage(translation.data.translatedText, reaction.message.channel.id, reaction.message.id);
            } else if(reaction.emoji.name === '🇺🇸' || reaction.emoji.name === '🇨🇦' || reaction.emoji.name === '🇬🇧') {
                let detectedLanguage = await detectLanguage(reaction.message.content);
                let translation = await axios.post(translateURL, {
                    q: reaction.message.content,
                    source: detectedLanguage,
                    target: "en"
                });
                await nuclient.createReplyMessage(translation.data.translatedText, reaction.message.channel.id, reaction.message.id);
            }
        });

        // Channel Mirroring
        /*let enWebhook = await client.fetchWebhook(process.env.TRANSLATE_EN_WEBHOOKID, process.env.TRANSLATE_EN_WEBHOOKTOKEN);
        let koWebhook = await client.fetchWebhook(process.env.TRANSLATE_KO_WEBHOOKID, process.env.TRANSLATE_KO_WEBHOOKTOKEN);
        let jaWebhook = await client.fetchWebhook(process.env.TRANSLATE_JA_WEBHOOKID, process.env.TRANSLATE_JA_WEBHOOKTOKEN);

        let enChannelID = process.env.TRANSLATE_EN_CHANNELID;
        let koChannelID = process.env.TRANSLATE_KO_CHANNELID;
        let jaChannelID = process.env.TRANSLATE_JA_CHANNELID;

        client.on("message", async msg => {
            if(msg.webhookID) {
                return;
            }
            if(msg.channel.id === enChannelID) {
                // Hacky way of ignoring emote
                if(msg.content.startsWith("<")) {
                    await koWebhook.send(msg.content, {
                        username: msg.author.username,
                        avatarURL: msg.author.displayAvatarURL,
                    });
                    await jaWebhook.send(msg.content, {
                        username: msg.author.username,
                        avatarURL: msg.author.displayAvatarURL,
                    });
                    return;
                }
                let res = await axios.post(translateURL, {
                    q: msg.content,
                    source: "en",
                    target: "ko"
                });
                await koWebhook.send(res.data.translatedText, {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL,
                });
                res = await axios.post(translateURL, {
                    q: msg.content,
                    source: "en",
                    target: "ja"
                });
                await jaWebhook.send(res.data.translatedText, {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL,
                });
            } else if (msg.channel.id === koChannelID) {
                if(msg.content.startsWith("<")) {
                    await enWebhook.send(msg.content, {
                        username: msg.author.username,
                        avatarURL: msg.author.displayAvatarURL,
                    });
                    await jaWebhook.send(msg.content, {
                        username: msg.author.username,
                        avatarURL: msg.author.displayAvatarURL,
                    });
                    return;
                }
                let res = await axios.post(translateURL, {
                    q: msg.content,
                    source: "ko",
                    target: "en"
                });
                await enWebhook.send(res.data.translatedText, {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL,
                });
                res = await axios.post(translateURL, {
                    q: msg.content,
                    source: "ko",
                    target: "ja"
                });
                await jaWebhook.send(res.data.translatedText, {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL,
                });
            } else if (msg.channel.id === jaChannelID) {
                if(msg.content.startsWith("<")) {
                    await enWebhook.send(msg.content, {
                        username: msg.author.username,
                        avatarURL: msg.author.displayAvatarURL,
                    });
                    await koWebhook.send(msg.content, {
                        username: msg.author.username,
                        avatarURL: msg.author.displayAvatarURL,
                    });
                    return;
                }
                let res = await axios.post(translateURL, {
                    q: msg.content,
                    source: "ja",
                    target: "en"
                });
                await enWebhook.send(res.data.translatedText, {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL,
                });
                res = await axios.post(translateURL, {
                    q: msg.content,
                    source: "ja",
                    target: "ko"
                });
                await koWebhook.send(res.data.translatedText, {
                    username: msg.author.username,
                    avatarURL: msg.author.displayAvatarURL,
                });
            }
        });*/
    } catch (e) {
        console.trace(e);
    }

}

module.exports = init;