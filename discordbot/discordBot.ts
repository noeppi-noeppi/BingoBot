import {Client as DiscordClient, Guild} from "discord.js";
import * as discordGuild from "./discordGuild";
import * as discordDM from "./discordDM";
import {textChannel} from "./discordUtil";
import Timeout = NodeJS.Timeout;

export let rateLimited = false;
let rateLimitedTimeout: Timeout | null = null;

export async function startDiscordBot(discord: DiscordClient): Promise<(msg: string | null) => Promise<void>> {
    discord.on('rateLimit', data => {
        // Too many requests. We set the value of rateLimited, which will
        // stop all non-essential messages from occurring for 15 minutes.
        if (rateLimitedTimeout != null) {
            clearTimeout(rateLimitedTimeout);
        } else {
            // To make it clear that we are hitting a rate limit, we set the
            // status to idle
            discord.user?.setStatus('idle')
        }
        rateLimited = true;
        rateLimitedTimeout = setTimeout(() => {
            rateLimited = false;
            rateLimitedTimeout = null;
            discord.user?.setStatus('online')
        }, 15 * 60 * 1000)
    })
    if (process.env.DISCORD_GUILD == null) {
        throw new Error("No guild given")
    }
    const guild: Guild = await discord.guilds.fetch(process.env.DISCORD_GUILD);
    const roleChannel = await textChannel(discord, process.env.DISCORD_ROLE_CHANNEL);
    if (process.env.DISCORD_ROLE_MSG == undefined) {
        throw new Error("No message for reactions given")
    }
    const roleMessage = await roleChannel.messages.fetch(process.env.DISCORD_ROLE_MSG)
    await discordDM.startDiscordDMBot(discord, guild)
    return await discordGuild.startDiscordGuildBot(
        discord, guild,
        await textChannel(discord, process.env.DISCORD_PING_CHANNEL),
        roleChannel, roleMessage.id
    )
}