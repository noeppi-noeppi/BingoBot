import {
    Client as DiscordClient, EmbedFieldData,
    Guild,
    GuildMember,
    MessageReaction,
    PartialUser,
    Snowflake,
    TextChannel,
    User
} from "discord.js";
import { embedList } from "./discordUtil";
import * as mcquery from "../mcquery/bingoQuery"
import {StatusResponse} from "minecraft-server-util/dist/model/StatusResponse";

export async function startDiscordGuildBot(
    discord: DiscordClient, guild: Guild,
    pingChannel: TextChannel, roleChannel: TextChannel,
    roleMessage: string | null
): Promise<(msg: string | null) => Promise<void>> {
    if (process.env.DISCORD_ROLE === undefined) {
        throw new Error("No discord role provided");
    }
    const role = process.env.DISCORD_ROLE
    if (process.env.DISCORD_REACT_EMOTE === undefined) {
        throw new Error("No discord reaction emote provided");
    }
    const emote = process.env.DISCORD_REACT_EMOTE

    let currentQueryMsg: Snowflake | null = null
    let currentBingoText: string | null = null

    function getCurrentMessage(query: StatusResponse | null) {
        const fields: Array<EmbedFieldData> = [
            {
                name: "Live",
                value: "https://www.twitch.tv/castcrafter"
            },
            {
                name: "Mitspielen",
                value: "https://www.curseforge.com/minecraft/modpacks/castbingo"
            },
            {
                name: "Leaderboard",
                value: "https://git.io/bingowinners"
            }
        ]
        if (query != null) {
            if (query.onlinePlayers != null || query.maxPlayers != null) {
                fields.push({
                    name: "Spieler online",
                    value: `${query.onlinePlayers == null ? '-' : query.onlinePlayers} / ${query.maxPlayers == null ? '-' : query.maxPlayers}`
                })
            }
            if (query.description != null) {
                fields.push({
                    name: "Modpack",
                    value: query.description.toRaw()
                })
            }
        }
        return {
            content: `<@&${role}>`,
            embed: embedList("CastCrafter spielt nun Bingo!", currentBingoText, "https://i.imgur.com/8dZAHyI.png", fields)
        }
    }
    
    discord.on("messageReactionAdd", async (reaction: MessageReaction, user: User | PartialUser) => {
        if (emote == reaction.emoji.id && reaction.message.id == roleMessage && reaction.message.guild != null) {
            let member: GuildMember = await reaction.message.guild.members.fetch(user.id);
            await member.roles.add(role);
        }
    })
    
    discord.on("messageReactionRemove", async (reaction: MessageReaction, user: User | PartialUser) => {
        if (emote == reaction.emoji.id && reaction.message.id == roleMessage && reaction.message.guild != null) {
            let member: GuildMember = await reaction.message.guild.members.fetch(user.id);
            await member.roles.remove(role);
        }
    })

    await mcquery.startQuery(async query => {
        if (currentQueryMsg != null) {
            const message = await pingChannel.messages.fetch(currentQueryMsg)
            await message.edit(getCurrentMessage(query))
        }
    })
    
    return async function (msg: string) {
        currentBingoText = msg
        const message = await pingChannel.send(getCurrentMessage(null))
        currentQueryMsg = message.id
        mcquery.enableFastQuery()
    }
}
