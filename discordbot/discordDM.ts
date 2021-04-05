import {
    Client as DiscordClient, DMChannel, EmbedFieldData,
    Guild,
    GuildMember, Message, MessageEmbed,
    Snowflake,
    User
} from "discord.js";
import {embed, embedList} from "./discordUtil";
import fetch from "node-fetch"

export async function startDiscordDMBot(discord: DiscordClient, memberGuild: Guild) {
    if (process.env.DISCORD_ROLE === undefined) {
        throw new Error("No discord role provided");
    }
    const role = process.env.DISCORD_ROLE
    discord.on('message', async msg => {
        if (msg.channel.type == 'dm' && discord.user != null && msg.author.id != discord.user.id) {
            const channel: DMChannel = msg.channel as DMChannel
            let member: GuildMember | null;
            try {
                member = await memberGuild.members.fetch(channel.recipient)
            } catch (err) {
                member = null;
            }
            if (member != null) {
                try {
                    await processCommand(discord, memberGuild, channel.recipient, member, channel, msg, role)
                } catch (err) {
                    try {
                        await channel.send({embed: embed('Fehler', 'Es ist ein Fehler aufgetreten.', null)})
                    } catch (err) {
                        //
                    }
                }
            }
        }
    })
}

async function processCommand(discord: DiscordClient, memberGuild: Guild, user: User,
                              member: GuildMember, channel: DMChannel, msg: Message, role: Snowflake) {
    const rawCommand = msg.cleanContent.trim()
    if (rawCommand.startsWith("!")) {
        const command = rawCommand.substr(1).trim().toLowerCase()
        const parts = command.split(/\s+/)
        if (parts.length <= 0) {
            await channel.send({ embed: embed('Unknown command. Use `!help` for help', '', null) })
        }
        switch (parts[0]) {
            case 'help':
                await channel.send({ embed: getHelpEmbed() })
                break
            case 'optifine':
                await channel.send({ embed: embed('OptiFine :rage:', 'OptiFine ist nicht im ModPack und wird nicht ins mod pack kommen.', null) })
                break
            case 'ping':
                await member.roles.add(role)
                await channel.send({ embed: embed('Benachrichtigungen aktiviert.', 'Du wirst nun in <#752937522832867409> benachrichtigt wenn CastCrafter Bingo spielt.', null) })
                break
            case 'unping':
                await member.roles.remove(role)
                await channel.send({ embed: embed('Benachrichtigungen deaktiviert.', 'Du wirst nun nicht mehr in <#752937522832867409> benachrichtigt wenn CastCrafter Bingo spielt.', null) })
                break
            case 'changelog':
                const resp_cl = await fetch('https://api.github.com/repos/MelanX/castBINGO/contents/changelogs')
                const json_cl: Array<any> = await resp_cl.json()
                if (json_cl.length <= 0) {
                    await channel.send({ embed: embed('Fehler', 'Keine changelogs gefunden.', null) })
                } else {
                    const url = json_cl[json_cl.length - 1].download_url
                    const changelog = await fetch(url)
                    await channel.send({
                        content: `**${json_cl[json_cl.length - 1].name}**\n\n${replaceChangelog(await changelog.text())}`,
                        split: true
                        
                    })
                }
                break
            case 'mod':
                await channel.send({ embed: embedList('Mod-Vorschlag', 'Du möchtest eine Mod für das pack vorschlagen? Das kannst du auf GitHub tun.', null, [
                        {
                            name: "Mod Vorschlagen",
                            value: "https://github.com/MelanX/castBINGO/issues/new?assignees=&labels=mod%20request&template=mod_request.md"
                        }
                    ]) })
                break
            case 'leaderboard':
                const resp_lb = await fetch('https://gist.githubusercontent.com/noeppi-noeppi/a7eb0e0f9764d445e77535efa5e94006/raw/bingo_winners.md')
                await channel.send(getLeaderboardEmbed(await resp_lb.text()))
                break
            case 'was':
            case 'wawawa':
                await channel.send(embed('Was ist Bingo?',
                    'Bingo ist ein Projekt in dem CastCrafter mit zuschauern in Minecraft Bingo spielt. ' + 
                    'Dabei geht es darum in einer Welt möglichst schnell Aufgaben zu erfüllen. ' + 
                    'Standardmäßig gewinnt das Team, welches zuerst 5 Aufgaben in einer Reihe, Spalte oder Diagonale erreicht. ' + 
                    'Allerdings kann Bingo in vielen anderen Varianten gespielt werden.\n\n' + 
                    'Das Bingo wird mit einem ModPack gespielt, welches du hier herunterladen kannst:\n' + 
                    'https://www.curseforge.com/minecraft/modpacks/castbingo\n' + 
                    '\n' + 
                    'Wenn du benachrichtigt werden möchtest, wenn Bingo gespielt wird, nutze `!ping`.'
                    , 'https://i.imgur.com/8dZAHyI.png'))
                break
            case 'pack':
                const json_cf_a = await (await fetch('https://addons-ecs.forgesvc.net/api/v2/addon/408447')).json()
                const cf_file = json_cf_a.defaultFileId
                const json_cf_f = await (await fetch(`https://addons-ecs.forgesvc.net/api/v2/addon/408447/file/${cf_file}`)).json()
                let display = (json_cf_f.displayName as string)
                if (display.toLowerCase().endsWith('.zip')) {
                    display = display.substring(0, display.length - 4)
                }
                await channel.send({ embed: embedList('ModPack Information', 'Das `castBINGO!` ModPack wird zum Bingo spielen verwendet. Wen ndu es installieren willst nutze `!install`.', null, [
                        {
                            name: "Aktuelle Version",
                            value: display
                        },
                        {
                            name: "Download",
                            value: `https://www.curseforge.com/minecraft/modpacks/castbingo/files/${json_cf_f.id}`
                        }
                    ]) })
                break
            case 'install':
                await installCommand(discord, memberGuild, user, member, channel, parts.slice(1))
                break
            default:
                await channel.send({ embed: embed('Unknown command. Use `!help` for help', '', null) })
        }
    }
}

function getHelpEmbed() {
    return embed('BingoBot Commands',
        '\n' +
        '`!changelog`   Zeigt den Changelog des ModPacks\n' +
        '`!help`   Zeigt die Hilfe\n' +
        '`!install`   Wie installiere ich das Pack?\n' + 
        '`!leaderboard`   Zeigt das Bingo Leaderboard.\n' +
        '`!mod`    Mach einen vorschlag für eine Mod die hinzugefügt werden soll.\n' +
        '`!optifine`   Zeigt informationen zu OptiFine\n' +
        '`!pack`   Zeigt Informationen zum ModPack\n' +
        '`!ping`   Du möchtest bei Bingo benachrichtigt werden?\n' +
        '`!unping`   Du möchtest nicht mehr benachrichtigt werden?\n' +
        '`!was`   Was ist Bingo?\n' + 
        '`!wawawa`   Siehe `!was`',
        null
    )
}

function replaceChangelog(changelog: string): string {
    return changelog.split('\n').map(line => {
        if (line.trim().startsWith("#")) {
            const match2 = line.match(/^\s*##+\s*(.*?)\s*#*\s*$/)
            if (match2 != null && match2.length > 1) {
                return `**${match2[1]}**`
            }
            const match = line.match(/^\s*#\s*(.*?)\s*#*\s*$/)
            if (match != null && match.length > 1) {
                return `***${match[1]}***`
            }
        }
        return line
    }).join('\n')
}

function getLeaderboardEmbed(leaderboard: string): MessageEmbed {
    const lines = leaderboard.split('\n').map(line => line.trim())
    let text = ''
    let leaderBoardStarted = false;
    const fields: Array<EmbedFieldData> = []
    for (const line of lines) {
        if (line == '') {
            //
        } else if (leaderBoardStarted) {
            if (fields.length < 10) {
                const match = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\||$/)
                if (match != null && match.length > 2) {
                    fields.push({
                        name: match[1],
                        value: `Score: ${match[2]}`
                    })
                }
            }
        } else if (line.startsWith("|")) {
            if (line.match(/^\|(\s*[:\-]+\s*\|)+$/) != null) {
                leaderBoardStarted = true
            }
        } else if (!line.startsWith("#")) {
            text += '\n'
            text += line
            text = text.trim()
        }
    }
    text += '\n'
    text += 'https://git.io/bingowinners'
    text = text.trim()
    return embedList('castBINGO! Leaderboard', text, 'https://i.imgur.com/8dZAHyI.png', fields)
}

async function installCommand(discord: DiscordClient, memberGuild: Guild, user: User,
                              member: GuildMember, channel: DMChannel, parts: Array<string>) {
    switch (parts.length == 0 ? "" : parts[0]) {
        case 'multimc':
            await channel.send({ embed: embed('MultiMC',
                    '1. auf `Instanz hinzufügen` klicken.\n' + 
                    '2. Links `Twitch` auswählen.\n' + 
                    '3. Nach `castBINGO!` suchen und Enter drücken.\n' + 
                    '4. Das `castBINGO!` ModPack auswählen un `Ok` klicken.\n' + 
                    '5. auf `Instanz hinzufügen` klicken.\n' + 
                    '6. Es wurde eine neue Instanz angelegt. Mache einen Doppel-Klick darauf.',
                    'https://multimc.org/images/infinity32.png'
                ) })
            break
        case 'help':
        default:
            await channel.send({ embed: embed('Bitte wähle deinen launcher.',
                    'Wenn du keinen dieser launcher benutzt, solltest du einen davon installieren. Empfohlen wird MultiMC.\n\n' +
                    '`!install multimc`   MultiMC (https://multimc.org)\n' +
                    '`!install curse`   CurseForge Launcher (https://curseforge.overwolf.com)\n' +
                    '`!install gdlauncher`   GDLauncher (https://gdevs.io/)',
                    null
                ) })
    }
}