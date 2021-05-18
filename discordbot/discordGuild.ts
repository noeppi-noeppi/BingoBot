import {
    Client as DiscordClient, EmbedFieldData,
    Guild,
    GuildMember, MessageOptions,
    MessageReaction,
    PartialUser,
    Snowflake,
    TextChannel,
    User
} from "discord.js";
import {embedList} from "./discordUtil";
import {rateLimited} from "./discordBot";
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

    // Cache the values and only edit if sth changed
    let hasQuery = false;
    let online = '-';
    let maxOnline = '-';
    let description: string | null = '';
    let rate = 0;
    setInterval(() => rate = (rate > 0 ? (rate - 1) : 0), 5 * 60 * 1000)

    function getCurrentMessage(query: StatusResponse | null, force: true): MessageOptions & { split?: false }
    function getCurrentMessage(query: StatusResponse | null, force: false): MessageOptions & { split?: false } | null
    function getCurrentMessage(query: StatusResponse | null, force: boolean): (MessageOptions & { split?: false }) | null {
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
        let requiresEdit: boolean;
        if (query == null) {
            if (!hasQuery && !force) {
                return null;
            }
            hasQuery = false;
            requiresEdit = true;
        } else {
            requiresEdit = !hasQuery;
            hasQuery = true;
            if ((query.onlinePlayers == null ? '-' : query.onlinePlayers.toString()) != online) {
                online = query.onlinePlayers == null ? '-' : query.onlinePlayers.toString();
                requiresEdit = true;
            }
            if ((query.maxPlayers == null ? '-' : query.maxPlayers.toString()) != maxOnline) {
                maxOnline = query.onlinePlayers == null ? '-' : query.onlinePlayers.toString();
                requiresEdit = true;
            }
            if ((query.description == null) != (description == null)
                || query.description != null && query.description.toRaw() != description) {
                description = query.description == null ? null : query.description.toRaw();
                requiresEdit = true;
            }

            fields.push({
                name: "Spieler online",
                value: `${online} / ${maxOnline}`
            })

            if (description != null) {
                fields.push({
                    name: "Modpack",
                    value: description
                })
            }
        }
        if (requiresEdit || force) {
            if ((rate >= 100 || rateLimited) && !force) {
                return null;
            }
            rate += 1;
            return {
                content: `<@&${role}>`,
                embed: embedList("CastCrafter spielt nun Bingo!", currentBingoText, "https://i.imgur.com/8dZAHyI.png", fields)
            }
        } else {
            return null;
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
            let msg = getCurrentMessage(query, false);
            if (msg != null) {
                await message.edit(msg);
            }
        }
    })

    return async function (msg: string) {
        currentBingoText = msg
        const message = await pingChannel.send(getCurrentMessage(null, true))
        currentQueryMsg = message.id
        mcquery.enableFastQuery()
    }
}
