import { Bot } from "@/core/classes/Bot";

export default Bot.createCommand({
    name: "ping",
    aliases: ["p"],
    run: async ({ message, reply, args }) => {
        console.log(args);
        const ping = Date.now() - Number(message.timestampMs);

        reply(`Pong! 🏓 | Latency: ${ping}ms`);
    },
});
