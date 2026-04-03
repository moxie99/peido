// Custom ESM loader: stubs out 'server-only', 'next/headers', and 'next/navigation'
// so server modules can be imported in tests without a Next.js runtime.
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./tests/loader-hooks.mjs', pathToFileURL('./'))
