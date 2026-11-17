/**
 * Folds the per-screen translation fragments (src/lib/i18n/screens/*.ts) into the shared
 * dictionaries and empties them (docs/plans/traduccion-por-pantalla.md).
 *
 * - A sentence already in a dictionary gets its Spanish replaced where it lives (an area file
 *   is merged after es.ts and wins, so it is replaced there, not shadowed).
 * - A new sentence is appended to es.ts (own text) or incoming/configuration.ts (Rust text).
 * - Two fragments giving one sentence different Spanish stop the fold.
 * - For each replaced sentence, the folders that draw it are printed: a fix is global.
 *
 * Usage: npx tsx scripts/fold-screen-i18n.mts [--dry]
 */
import { runFold } from './fold-screen-i18n-lib.mjs';

await runFold(process.cwd(), { dry: process.argv.includes('--dry') });
