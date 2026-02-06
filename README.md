# Yard

Yard makes working on multiple local projects simpler by routing each server to
`<name>.localhost`.

## Install

```bash
npm add -g @kranehq/yard
```

## Usage

Configure your dev server to use `YARD_PORT` instead of the default like `5173`.
Then, just prefix your command with `yard <...args> --`

```bash
yard -n myapp -- npm run dev
```

This then routes all requests to `myapp.localhost:3000`. The port and hostname
can be changed through args or `yard.config.ts`.

## Vite Plugin

```ts
import { defineConfig } from "vite";
import { yard } from "@kranehq/yard-vite";

export default defineConfig({
    plugins: [yard()],
});
```
