import { type CommandParams } from "@/core/classes";

export default async ({ client, message, send, reply }: CommandParams) => {
    const prefix = process.env.BOT_PREFIX;
    if (typeof message.text !== "string") return;
    if (!message.text.startsWith(prefix)) return;
    const args = message.text.slice(prefix.length).trim().split(/\s|\n/);
    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;

    const command = client.commands.get(cmd);
    if (!command) return;

    try {
        await command.run({ client, message, args, send, reply });
    } catch (error) {
        console.error(`Error executing command ${cmd}`);
        console.error(error);
    }
};
