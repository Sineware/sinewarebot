/*
    BSSCCBot for Discord
    Copyright (C) 2021  Seshan Ravikumar

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

console.log("Starting SinewareBot...");

require('dotenv').config();
const Discord = require('discord.js');

const {mapCommand} = require('./commandHandler');
const {initDB, connectDB} = require('./services/database/database');

const loadPlugins = require("./services/plugin-loader/plugins");

const nuclient = require("./services/nuapi/api");

let isLoaded = false;

async function main() {
    console.log("Starting up NuAPI...")
    let bot = await nuclient.connectDiscord();
    bot.on("connected", (resumed) => {
        log.info("NuAPI Client Started, continuing startup...");

        // Legacy DiscordJS Client
        const client = new Discord.Client({disableEveryone: true, disableMentions: 'everyone'});

        client.on('ready', async () => {
            console.log(`[Legacy API] DiscordJS logged in as ${client.user.tag}!`);

            // Kick-off loading.
            await botMain(client);

        });

        // Legacy Commands
        client.on('message', async (msg) => {
            await mapCommand(msg);
        });

        // NuAPI Commands
        bot.on("MESSAGE_CREATED", (msg) => {
            
        });

        client.login(process.env.BOT_TOKEN).then(r => {});
    });
}
main().then(r => {});


//Main Function
async function botMain(client) {
    if(!isLoaded) {
        try {
            // Create databases if they don't exist
            await initDB();

            // Connect to SQL Server
            await connectDB();

            // Load Plugins
            await loadPlugins(client, nuclient);

            isLoaded = true;
            console.log("-> SinewareBot has started!")
        } catch (e) {
            console.error("Failed to start SinewareBot:");
            console.error(e);
            process.exit(1);
        }

    } else {
        console.log("[Debug] The bot has reconnected.");
    }
}
