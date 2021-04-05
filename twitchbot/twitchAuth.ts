import { getTokenInfo, StaticAuthProvider } from "twitch-auth";
import { ChatClient } from "twitch-chat-client";

export async function registerTwitch(): Promise<ChatClient> {
    if (process.env.TWITCH_TOKEN === undefined) {
        throw new Error("No twitch token provided");
    }
    const tokenInfo = await getTokenInfo(process.env.TWITCH_TOKEN);
    const authProvider = new StaticAuthProvider(tokenInfo.clientId, process.env.TWITCH_TOKEN, tokenInfo.scopes);
    const chatClient = new CustomChatClient(authProvider);
    await chatClient.connect()
    await new Promise((resolve, _reject) => {
        chatClient.onRegister(() => resolve(undefined));
    });
    console.log("Connected to twitch")
    return chatClient;
}

class CustomChatClient extends ChatClient {
    join(channel: string): Promise<void> {
        this.onRegister(() => {
            this.join(channel);
        });

        return super.join(channel);
    }
}