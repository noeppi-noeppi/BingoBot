import { Client as DiscordClient } from "discord.js";

export async function registerDiscord(): Promise<DiscordClient> {
    if (process.env.DISCORD_TOKEN === undefined) {
        throw new Error("No twitch token provided");
    }
    const client = new DiscordClient({ partials: ["CHANNEL", "MESSAGE", "REACTION", "GUILD_MEMBER", "USER"] });
    await client.login(process.env.DISCORD_TOKEN);
    await client.user?.setStatus('online')
    console.log("Connected to discord")
    return client
}