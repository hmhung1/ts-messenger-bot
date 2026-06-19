import fs from "fs";
import {
    Client,
    type ClientEventMap,
    type E2EEMessage,
    type If,
    type Message,
    type SendMessageResult,
    type User,
    Utils,
} from "meta-messenger.js";
import path from "path";

import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

import { listen } from "../listen";

export type BaseParams = {
    client: Bot<true>;
    message: Message | E2EEMessage;
};

export type CommandParams = BaseParams & {
    args?: string[];
    send: (content: string) => Promise<SendMessageResult>;
    reply: (content: string) => Promise<SendMessageResult>;
};

type CommandProps = {
    name: string;
    aliases?: string[];
    run: (params: CommandParams) => Promise<void> | void;
};

type CreateEventProps<T extends keyof ClientEventMap = keyof ClientEventMap> = {
    eventName: T;
    once?: boolean;
    emit: (client: Bot<true>, ...args: ClientEventMap[T]) => void;
};

export class Bot<Ready extends boolean = boolean> extends Client<Ready> {
    public commands: Map<string, CommandProps> = new Map();
    public categories: Map<string, string[]> = new Map();
    public aliases: Map<string, string> = new Map();

    #readyAt: If<Ready, Date> = null as If<Ready, Date>;
    #user: If<Ready, User> = null as If<Ready, User>;

    constructor() {
        const cookieFilePath = path.join(process.cwd(), process.env.COOKIE_FILE_PATH);
        if (!fs.existsSync(cookieFilePath)) {
            throw new Error(`Cookie file not found at "${cookieFilePath}"`);
        }

        const cookiesString = fs.readFileSync(cookieFilePath, "utf-8");
        const cookies = Utils.parseCookies(cookiesString);

        super(cookies);
    }

    public get readyAt(): If<Ready, Date> {
        return this.#readyAt;
    }

    public get readyTimestamp(): If<Ready, number> {
        return (this.#readyAt ? this.#readyAt.getTime() : null) as If<Ready, number>;
    }

    public get uptime(): number {
        return this.readyTimestamp ? Date.now() - this.readyTimestamp : 0;
    }

    public get user(): If<Ready, User> {
        return this.#user;
    }

    public static createEvent<T extends keyof ClientEventMap>(props: CreateEventProps<T>) {
        return props;
    }

    public static createCommand(props: CommandProps) {
        return props;
    }

    public async loadPlugins() {
        const commandsPath = path.join(process.cwd(), "src/plugins/commands");
        const commandFiles = fs.readdirSync(commandsPath);
        let count = 0;

        for (const category of commandFiles) {
            const filePath = path.join(commandsPath, category);

            for (const cmd of fs.readdirSync(filePath)) {
                if (!cmd.endsWith(".ts")) continue;

                const commandFile = path.join(filePath, cmd);
                const command = await importDefault<CommandProps>(commandFile);
                if (!command) continue;

                this.commands.set(command.name, command);
                count++;

                if (command.aliases && command.aliases.length > 0) {
                    for (const alias of command.aliases) {
                        this.aliases.set(alias, command.name);
                    }
                }

                const cmds = this.categories.get(category) || [command.name];
                this.categories.set(category, [...cmds, command.name]);
            }
        }

        logger.log(`> Loaded ${count} command(s).`);
    }

    public start() {
        this.once("fullyReady", () => {
            logger.log("> Client is fully ready!");
            this.#readyAt = new Date() as If<Ready, Date>;
        });

        this.connect().then(({ user }) => {
            logger.log(`> Logged in as ${user.name} (ID: ${user.id})`);
            logger.log("> Please wait until bot is fully ready...");

            this.#user = user as If<Ready, User>;
            this.loadPlugins().then(() => {
                listen(this);
            });
        });
    }
}
