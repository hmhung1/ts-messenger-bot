export type LoggerBindFn = typeof console.log | typeof console.error | typeof console.warn;

export class logger {
    static createCustomLogger(fn: LoggerBindFn) {
        return (...args: unknown[]) => {
            const date = new Date();
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const seconds = String(date.getSeconds()).padStart(2, "0");

            fn(`\x1b[35m[${hours}:${minutes}:${seconds}]\x1b[0m`, ...args);
        };
    }

    static #log = this.createCustomLogger(console.log);
    static #error = this.createCustomLogger(console.error);
    static #warn = this.createCustomLogger(console.warn);

    static log(...args: unknown[]) {
        this.#log(...args);
    }

    static error(...args: unknown[]) {
        this.#error(...args);
    }

    static warn(...args: unknown[]) {
        this.#warn(...args);
    }
}
