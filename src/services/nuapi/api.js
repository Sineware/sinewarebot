// SinewareBot NuAPI
const EventEmitter = require('events')
const got = require("got");
const log = require("./log");
const os = require("os");
const Redis = require("ioredis");
const WebSocket = require("ws");

const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_SERVER); // uses defaults unless given configuration object

const {
    DISCORD_URL,
    DISCORD_API_VERSION,
    DISCORD_GATEWAY_API_VERSION,
    INTENTS_GUIDS,
    INTENTS_GUILD_MESSAGES
} = require("./constants.js");

const TOKEN = process.env.BOT_TOKEN;

// State
let eventEmitter;
let ws;

async function connectDiscord() {
    eventEmitter = new EventEmitter();

    log.info("Obtaining Discord Gateway URL...")
    const {body} = await got.get(DISCORD_URL + "/api/v" + DISCORD_API_VERSION + "/gateway", {
        responseType: "json"
    });

    log.debug(body.url);

    log.info("Attempting to establish WS gateway connection...");

    // Discord Gateway
    ws = new WebSocket(body.url + "/?v=" + DISCORD_GATEWAY_API_VERSION + "&encoding=json");

    ws.on("open", function open() {
        log.info("Successfully established WS connection with the Discord Gateway!");
    });
    ws.on("close", function close() {
        log.error('Discord Gateway WS Socket disconnected, restarting...');
        process.exit(1);
    });


    log.info("Registering WS handler...")
    ws.on("message", async function incoming(data) {
        try {
            let payload = JSON.parse(data);

            if(typeof payload.s === "number") {
                await redis.set("seq", payload.s);
            }

            switch(payload.op) {
                case 0:
                    log.debug("Opcode 1: Dispatch (Event)");
                    switch(payload.t) {
                        case "READY":
                            await redis.set("identified", "true");
                            await redis.set("sessionid", payload.d.session_id);
                            log.info("Successfully logged in as bot " + payload.d.user.username + "#" + payload.d.user.discriminator + "!");
                            eventEmitter.emit("connected", false);
                            break;
                        case "RESUMED":
                            await redis.set("identified", "true");
                            log.info("Successfully resumed session!");
                            eventEmitter.emit("connected", true);
                            break;
                        case "MESSAGE_CREATE":
                            if(payload.d.content.startsWith(";")) {
                                log.info(payload.t + " from " + payload.d.author.username + " (id " + payload.d.id+ " seq " + payload.s + ")");
                                if(payload.d.content === ";test")
                                    await createMessage(payload.t + " from " + payload.d.author.username + " (id " + payload.d.id+ " seq " + payload.s + ")", payload.d.channel_id);
                                else
                                    await createMessage(payload.d.content.substring(1) + ": Command not found.", payload.d.channel_id);
                            }
                            break;
                        default:
                            log.debug(payload);
                            log.warn("Unknown Event: " + payload.t);
                    }
                    break;
                case 1:
                    log.debug("Opcode 1: Heartbeat");
                    let seq = await redis.get("seq");
                    ws.send(JSON.stringify({
                        op: 1,
                        d: seq
                    }));
                    break;
                case 7:
                    log.debug("Opcode 7: Reconnect");
                    log.info("Got a reconnect request, restarting...");
                    await redis.set("identified", "false");
                    setTimeout(() => {
                        // todo handle this better
                        process.exit(9);
                    }, 1000);
                    break;
                case 9:
                    log.debug("Opcode 9: Invalid Session");
                    log.info("Cannot resume, restarting...");
                    await redis.set("identified", "false");
                    setTimeout(() => {
                        // todo handle this better
                        process.exit(9);
                    }, 1000);
                    break;
                case 10:
                    log.debug("Opcode 10: Hello");
                    setInterval(async () => {
                        let seq = await redis.get("seq");
                        // Send Heartbeat
                        ws.send(JSON.stringify({
                            op: 1,
                            d: seq
                        }));
                    }, payload.d.heartbeat_interval);
                    log.info("Successfully received Hello message!");
                    let isIdentified = await redis.get("identified");
                    if(isIdentified === "true") {
                        // Already identified, attempt to resume.
                        log.info("Attempting to resume session...");
                        let sessionid = await redis.get("sessionid");
                        let seq = await redis.get("seq");
                        ws.send(JSON.stringify({
                            "op": 6,
                            "d": {
                                "token": TOKEN,
                                "session_id": sessionid,
                                "seq": seq
                            }
                        }));
                    } else {
                        log.info("Attempting to identify with the gateway...");
                        ws.send(JSON.stringify({
                            "op": 2,
                            "d": {
                                "token": TOKEN,
                                "intents": INTENTS_GUIDS + INTENTS_GUILD_MESSAGES,
                                "properties": {
                                    "$os": os.platform(),
                                    "$browser": "sinewarebot",
                                    "$device": "sinewarebot"
                                },
                                "presence": {
                                    "activities": [{
                                        "name": "SinewareBot NuAPI",
                                        "type": 0
                                    }],
                                    "status": "dnd",
                                    "since": null,
                                    "afk": false
                                },
                            }
                        }));
                    }
                    break;
                case 11:
                    log.debug("Opcode 11: Heartbeat ACK");
                    break;
                default:
                    log.debug(payload);
                    log.warn("Unknown Opcode: " + payload.op);
            }
        } catch (e) {
            console.trace(e);
        }
    });

    return eventEmitter;
}

async function callAPI(endpoint, payload) {
    const {body} = await got.post(DISCORD_URL + "/api/v" + DISCORD_API_VERSION + endpoint, {
        headers: {
            "User-Agent": "SinewareBot (https://github.com/Sineware/sinewarebot, 2.0.0)",
            "Authorization": "Bot " + TOKEN
        },
        json: payload,
        responseType: "json"
    });
    return body;
}

async function createMessage(content, channelid) {
    const body = await callAPI("/channels/" + channelid + "/messages",
        {
            "content": content,
        });
    log.info(body);
}
async function createReplyMessage(content, channelid, msgid) {
    const body = await callAPI("/channels/" + channelid + "/messages",
        {
            "content": content,
            "message_reference": {
                "message_id": msgid
            }
        });
    log.info(body);
}

module.exports = {DISCORD_API_VERSION, connectDiscord, createMessage, createReplyMessage, callAPI, eventEmitter}