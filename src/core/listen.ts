import type { Message } from "meta-messenger.js";

import { Bot } from "@/core/classes";
import { command } from "@/core/handlers";

function createChatFunction(client: Bot, message: Message) {
    const send = (content: string) => {
        return client.sendMessage(message.threadId, { text: content });
    };

    const reply = (content: string) => {
        return client.sendMessage(message.threadId, {
            replyToId: message.id,
            text: content,
        });
    };

    return { send, reply };
}

export async function listen(client: Bot) {
    client.on("message", async message => {
        console.log("Received message:", message);
        const { send, reply } = createChatFunction(client, message);
        await command({ client, message, send, reply });
    });
}
