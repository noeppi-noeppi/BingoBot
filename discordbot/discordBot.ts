import {Client as DiscordClient, Guild} from "discord.js";
import * as discordGuild from "./discordGuild";
import * as discordDM from "./discordDM";
import {textChannel} from "./discordUtil";

export async function startDiscordBot(discord: DiscordClient): Promise<(msg: string | null) => Promise<void>> {
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