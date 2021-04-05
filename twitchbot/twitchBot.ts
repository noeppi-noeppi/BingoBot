import {ChatClient} from "twitch-chat-client";

export async function startTwitchBot(twitch: ChatClient, pingFunction: (msg: string | null) => Promise<void>): Promise<void> {
    console.log("Starting twitch bot")
    let cooldown = new Date().getTime()
    await twitch.join("#castcrafter")
    twitch.onMessage(async (channel, user, message, _msg) => {
        if (user.startsWith("#")) user = user.substr(1);
        const userNoLC = user;
        user = user.toLowerCase()
        message = message.trim()
        if (message.toLowerCase().startsWith("!bingoping") && new Date().getTime() > cooldown) {
            let bingoMsg: string | null = message.substr("!bingoping".length).trim()
            if (bingoMsg == "") bingoMsg = null
            const mods = (await twitch.getMods("#castcrafter")).map(s => {
                if (s.trim().startsWith("#")) return s.trim().substr(1).toLowerCase();
                return s.trim().toLowerCase()
            })
            if (!mods.includes(user) && user != 'castcrafter') {
                await twitch.say(channel, `@${userNoLC}, du darfst das nicht nutzen.`)
            } else {
                await pingFunction(bingoMsg)
                await twitch.say(channel, `@${userNoLC} Discord Ping erfolgreich.`)
            }
            cooldown = new Date().getTime() + (10 * 1000);
        }
    })
    console.log("Started twitch bot")
}