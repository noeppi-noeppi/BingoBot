require('dotenv').config({ path: 'tokens.env' });

import * as twitchAuth from "./twitchbot/twitchAuth"
import * as twitchBot from "./twitchbot/twitchBot"
import * as discordAuth from "./discordbot/discordAuth"
import * as discordBot from "./discordbot/discordBot"

(async () => {
    const discord = await discordAuth.registerDiscord();
    const pingFunc = await discordBot.startDiscordBot(discord)
    const twitch = await twitchAuth.registerTwitch();
    await twitchBot.startTwitchBot(twitch, pingFunc);
})()