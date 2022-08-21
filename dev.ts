#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from '$fresh/dev.ts';
import { setupCustomize } from './scripts/setup-customize.ts';

await setupCustomize();

await dev(import.meta.url, './main.ts');
