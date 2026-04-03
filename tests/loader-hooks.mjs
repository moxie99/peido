// Stub modules that require a Next.js runtime environment
const STUBS = new Set([
  'server-only',
  'next/headers',
  'next/navigation',
])

export async function resolve(specifier, context, nextResolve) {
  if (STUBS.has(specifier)) {
    return { shortCircuit: true, url: `data:text/javascript,// stub: ${specifier}` }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('data:text/javascript,// stub:')) {
    return { shortCircuit: true, format: 'module', source: '' }
  }
  return nextLoad(url, context)
}
