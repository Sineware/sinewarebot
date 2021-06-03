/* Music Bot  */
const fs = require('fs');
const youtubedl = require('youtube-dl-exec');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');

let isPlaying = false;
let musicQueue = []; // string array of queries

// Voice channel object
let vc = null;
// Voice channel connection (VoiceConnection) object.
let conn;
// Voice channel stream (StreamDispatcher) object.
let dispatcher;

// YTDL Stream
let ytdlStream;

async function playSong(search, msg) {
    if(isPlaying) {
        // Add song to the queue
        musicQueue.push(search)
        msg.reply("Your song has been added to the queue!")
    } else {
        isPlaying = true;
        dispatcher = null;

        // todo smarter URL matching
        if(search.includes("soundcloud.com")) {
            msg.channel.send("Downloading SoundCloud song, please wait!");
            try {
                fs.unlinkSync("song.wav")
            } catch {}

            try {
                let out = await youtubedl(search, {
                    noWarnings: true,
                    noCallHome: true,
                    noCheckCertificate: true,
                    preferFreeFormats: true,
                    audioFormat: "wav",
                    output: "song.wav"
                });
                console.log(out);
                console.log("-> Creating SoundCloud file dispactcher...")
                dispatcher = conn.playFile("song.wav");
                dispatcher.setVolume(0.5);
                dispatcher.setBitrate("auto");
                await msg.channel.send("Playing *" + search + "* from SoundCloud! :musical_note: ");
            } catch(e) {
                msg.channel.send(":frowning: Error playing that song, moving on...");
                msg.channel.send(e.message);
                console.trace(e)
                let next = musicQueue.shift();
                msg.channel.send("Playing next song: " + next);
                await playSong(next, msg);
                return;
            }
        } else {
            try {
                let ytResults = await ytsr(search);
                let result = ytResults.items[0];
                console.log(result)
                console.log("Playing " + result.title + " ==> " + result.url);
                if(typeof result.title === "undefined") {
                    msg.channel.send(":frowning: Error playing that song, moving on...")
                    let next = musicQueue.shift();
                    msg.channel.send("Playing next song: " + next);
                    await playSong(next, msg);
                    return;
                }
                ytdlStream = ytdl(result.url, { quality: "highestaudio", filter: 'audioonly' })
                dispatcher = conn.playStream(ytdlStream);
                dispatcher.setVolume(0.5);
                dispatcher.setBitrate("auto");
                await msg.channel.send("Playing *" + result.title + "* from YouTube... :musical_note:");
            } catch(e) {
                msg.channel.send(":frowning: Error playing that song, moving on...")
                let next = musicQueue.shift();
                msg.channel.send("Playing next song: " + next);
                await playSong(next, msg);
                return;
            }
        }
        dispatcher.stream.on('end', async () => {
            msg.channel.send("The song has finished playing!");
            isPlaying = false;
            if(musicQueue.length !== 0) {
                let next = musicQueue.shift();
                msg.channel.send("Playing next song: " + next);
                dispatcher = null;
                await playSong(next, msg);
            } else {
                await stopAllPlayback();
                await msg.reply("The party's over! :wave:");
                vc = null;
            }
        });
        return dispatcher;
    }
}

async function stopAllPlayback() {
    // Clean up and reset.
    if(vc !== null) {
        await vc.leave();
    }
    vc = null;
    conn = null;
    dispatcher = null;
    ytdlStream = null;
    isPlaying = false;
}

function init(client, cm, ap) {
    cm.push(
        {
            "command": "play",
            "category": "Music",
            "desc": "Plays or Queues a song in a VC (!play [song name])",
            "handler": async (msg) => {
                try{
                    let search = ap(msg.content);
                    console.log("query:" + search[1]);
                    if(search[0] === "") {
                        await msg.reply("You need to tell me what to play!");
                        return;
                    }
                    /*if(search[1].includes("soundcloud.com")) {
                        await msg.reply(":x: SoundCloud support is currently disabled!");
                        return;
                    }*/
                    if(vc === null) {
                        vc = msg.member.voiceChannel;
                        try {
                            conn = await vc.join();
                            await msg.reply("Connected :tada:... Please wait...");
                        } catch (e) {
                            await msg.channel.send("Could not connect :no_entry_sign:... are you in a voice channel?");
                            vc = null;
                            console.trace(e);
                            return;
                        }
                    }
                    await playSong(search[1], msg);
                } catch (e) {
                    await msg.reply("Oops, there was an error trying to play the song... :frowning:");
                    console.trace(e);
                }
            }
        }
    );
    cm.push(
        {
            "command": "stop",
            "category": "Music",
            "desc": "Stops playing music and leaves the VC",
            "handler": async(msg) => {
                if(vc == null) {
                    msg.reply("I am not playing anything!");
                    return;
                }
                await stopAllPlayback();
                await msg.reply("The party's over! :wave:");
                vc = null;
            }
        }
    );
    cm.push(
        {
            "command": "skip",
            "category": "Music",
            "desc": "Skip the current song",
            "handler": async(msg) => {
                if(vc == null)
                    return msg.reply("I am not playing anything!");
                if(musicQueue.length === 0) {
                    await msg.reply("No more songs left in the queue!");
                    await stopAllPlayback();
                    return;
                }
                await msg.reply(":track_next: Skipping the current song...");
                dispatcher.end();
            }
        }
    );
    cm.push(
        {
            "command": "queue",
            "category": "Music",
            "desc": "Display the music queue",
            "handler": async(msg) => {
                if(musicQueue.length === 0)
                    return await msg.reply("The queue is empty!");
                await msg.reply("\n-> "+ musicQueue.join("\n- "));
            }
        }
    );
}

module.exports = init;
