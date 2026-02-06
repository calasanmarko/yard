#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
    connect,
    createServer as createNetServer,
    type Server,
} from "node:net";
import { parseConfig, type ParsedYardConfig } from "./cli.js";

const listen = (server: Server, port: number, host: string) =>
    new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
            server.off("listening", onListening);
            reject(error);
        };
        const onListening = () => {
            server.off("error", onError);
            resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, host);
    });

const closeServer = (server: Server) =>
    new Promise<void>((resolve, reject) => {
        server.close((error) => {
            if (!error) {
                resolve();
                return;
            }

            const { code } = error as NodeJS.ErrnoException;
            if (code === "ERR_SERVER_NOT_RUNNING") {
                resolve();
                return;
            }

            reject(error);
        });
    });

const startSocketProxy = async ({
    targetPort,
    proxyPort,
    name,
}: {
    targetPort: number;
    proxyPort: number;
    name: string;
}) => {
    const server = createNetServer((client) => {
        const upstream = connect(targetPort, "127.0.0.1");
        client.pipe(upstream).pipe(client);

        client.once("error", () => {
            upstream.destroy();
        });
        upstream.once("error", () => {
            client.destroy();
        });
    });

    await listen(server, proxyPort, `${name}.localhost`);

    return async () => {
        await closeServer(server);
    };
};

const findFreePort = () =>
    new Promise<number>((resolvePort, reject) => {
        const server = createNetServer();
        server.once("error", reject);
        server.listen(0, () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                server.close(() =>
                    reject(new Error("Failed to allocate free port"))
                );
                return;
            }

            const { port } = address;
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolvePort(port);
            });
        });
    });

const spawnCommand = ({
    positionals,
    host,
    port,
    publicPort,
}: {
    positionals: string[];
    host: string;
    port: number;
    publicPort: number;
}) =>
    new Promise<number>((resolveCode, reject) => {
        const [command, ...args] = positionals;
        if (!command) {
            reject(new Error("Missing command"));
            return;
        }

        const child = spawn(command, args, {
            env: {
                ...process.env,
                YARD_HOST: host,
                YARD_PORT: String(port),
                YARD_PUBLIC_PORT: String(publicPort),
            },
            stdio: "inherit",
        });

        child.once("error", reject);
        child.once("exit", (code, signal) => {
            if (signal) {
                resolveCode(1);
                return;
            }
            resolveCode(code ?? 1);
        });
    });

const yard = async ({
    name,
    positionals,
    port: proxyPort = 3000,
}: ParsedYardConfig) => {
    const targetPort = await findFreePort();
    const stopProxy = await startSocketProxy({
        targetPort,
        proxyPort,
        name,
    });

    try {
        return await spawnCommand({
            positionals,
            host: `${name}.localhost`,
            port: targetPort,
            publicPort: proxyPort,
        });
    } finally {
        await stopProxy();
    }
};

export const main = async () => {
    const config = await parseConfig();
    if (config.positionals.length === 0) {
        console.error(
            "Missing command. Usage: yard [--project <name>] <command ...>"
        );
        process.exit(1);
    }

    const code = await yard(config);
    process.exit(code);
};

if (import.meta.main) {
    await main();
}
