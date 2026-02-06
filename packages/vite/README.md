# @kranehq/yard-vite

Vite plugin that wires Vite dev server settings to Yard runtime env vars.

## Install

```bash
bun add -D @kranehq/yard-vite
```

## Usage

```ts
import { defineConfig } from "vite";
import { yard } from "@kranehq/yard-vite";

export default defineConfig({
    plugins: [yard()],
});
```
