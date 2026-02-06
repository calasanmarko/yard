import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs, type ParseArgsOptionDescriptor } from "node:util";

export type YardConfig = {
    name: string;
    port?: number | undefined;
};

export type ParsedYardConfig = Awaited<ReturnType<typeof parseConfig>>;

const options = {
    config: { type: "string", short: "c" },
    name: { type: "string", short: "n" },
    port: { type: "string", short: "p" },
} satisfies Record<"config" | keyof YardConfig, ParseArgsOptionDescriptor>;

const splitArgs = (argv: string[]) => {
    const splitIndex = argv.indexOf("--");
    if (splitIndex === -1) {
        return { optionArgs: [] as string[], positionals: argv };
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
