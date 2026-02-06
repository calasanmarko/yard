import type { Plugin } from "vite";

export const yard = () =>
    ({
        config: (config, env) => {
            if (env.command !== "serve") {
                return undefined;
            }

            return {
                server: {
                    ...config.server,
                    ...(process.env["YARD_HOST"]
                        ? { host: process.env["YARD_HOST"] }
                        : {}),
                    ...(process.env["YARD_PORT"]
                        ? { port: parseInt(process.env["YARD_PORT"]) }
                        : {}),
                    host: "127.0.0.1",
                },
            };
        },
        name: "yard:vite-plugin",
    }) satisfies Plugin;
