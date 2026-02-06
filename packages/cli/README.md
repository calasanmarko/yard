# Yard

Yard gives each local app a stable `*.localhost` hostname so you can run
multiple projects without port juggling.

## Packages

- `@kranehq/yard`: CLI that starts your command with `YARD_*` env vars and
  proxies traffic from `<name>.localhost:<publicPort>`.
- `@kranehq/yard-vite`: Vite plugin that reads Yard env vars and configures the
  dev server for Yard.

## Install

```bash
bun add -g @kranehq/yard
```

## Quick Start

1. Configure your dev server to use `YARD_PORT` and `YARD_HOST`.
2. Start it through Yard:

```bash
yard -n myapp -- bun run dev
```

3. Open:

```txt
http://myapp.localhost:3000
```

## CLI

```txt
$ yard --help
Yard routes local dev servers to stable *.localhost hostnames.

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
  yard -c ./yard.config.ts -- bun run dev
```

### Environment Variables Passed To Your Command

- `YARD_HOST`: `<name>.localhost`
- `YARD_PORT`: allocated internal port for your dev server to bind to
- `YARD_PUBLIC_PORT`: external proxy port

## Config File

By default, Yard reads `yard.config.ts` as an ESM module.

```ts
export default {
    name: "myapp",
    port: 3000,
};
```

Flags override file values.

## Vite Plugin

Install:

```bash
bun add -d @kranehq/yard-vite
```

Configure:

```ts
import { defineConfig } from "vite";
import { yard } from "@kranehq/yard-vite";

export default defineConfig({
    plugins: [yard()],
});
```

Run through Yard:

```bash
yard -n myapp -- bun run dev
```
