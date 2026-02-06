import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs, type ParseArgsOptionDescriptor } from "node:util";

export type YardConfig = {
    name: string;
    port?: number | undefined;
};

export type ParsedYardConfig = Exclude<
    Awaited<ReturnType<typeof parseConfig>>,
    undefined
>;

export const helpText = `Yard routes local dev servers to stable *.localhost hostnames.

Usage:
  yard [options] -- <command> [args...]

Options:
  -n, --name <name>      Project hostname prefix (required unless in config)
  -p, --port <port>      Public proxy port (default: 3000)
  -c, --config <path>    Config module path (default: ./yard.config.ts)
  -h, --help             Show help

Examples:
  yard -n myapp -- bun run dev
  yard -n api -p 4000 -- bun run dev
  yard -c ./yard.config.ts -- bun run dev`;

const options = {
    config: { type: "string", short: "c" },
    help: { type: "boolean", short: "h" },
    name: { type: "string", short: "n" },
    port: { type: "string", short: "p" },
} satisfies Record<
    "config" | "help" | keyof YardConfig,
    ParseArgsOptionDescriptor
>;

const splitArgs = (argv: string[]) => {
    const splitIndex = argv.indexOf("--");
    if (splitIndex === -1) {
        return { optionArgs: argv, positionals: [] as string[] };
    }
    return {
        optionArgs: argv.slice(0, splitIndex),
        positionals: argv.slice(splitIndex + 1),
    };
};

export const parseConfig = async (argv = process.argv.slice(2)) => {
    const { optionArgs, positionals } = splitArgs(argv);
    const args = parseArgs({
        args: optionArgs,
        options,
        strict: true,
        allowPositionals: false,
    });

    if (args.values.help) {
        return undefined;
    }

    const configPath = resolve(args.values.config ?? "yard.config.ts");
    const configExists = await access(configPath)
        .then(() => true)
        .catch((e) => {
            if (e.code === "ENOENT") {
                return false;
            }
            throw e;
        });

    if (args.values.config && !configExists) {
        throw new Error(`Config file ${configPath} does not exist`);
    }

    const fileConfig = configExists
        ? ((await import(configPath)).default as YardConfig)
        : undefined;

    const parsedConfig = {
        ...fileConfig,
        ...args.values,
        port: fileConfig?.port ? Number(fileConfig.port) : undefined,
    };

    if (!parsedConfig.name) {
        throw new Error("Missing flag or config option: --name or -n");
    }

    return {
        ...parsedConfig,
        name: parsedConfig.name,
        positionals,
    };
};
