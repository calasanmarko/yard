import { readFile } from "node:fs/promises";
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

    const fileConfigText = await readFile(
        args.values.config ?? "yard.config.ts",
        "utf8"
    ).catch((e) => {
        if (!args.values.config && e.code === "ENOENT") {
            return undefined;
        }
        throw e;
    });

    const fileConfig =
        fileConfigText === undefined
            ? undefined
            : (JSON.parse(fileConfigText) as YardConfig);

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
