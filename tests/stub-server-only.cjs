// Stub 'server-only' and Next.js server-side modules for test environments
const Module = require('node:module')
const originalLoad = Module._load

Module._load = function (request, parent, isMain) {
  if (request === 'server-only') {
    return {}
  }
  if (request === 'next/headers') {
    return { cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }
  }
  if (request === 'next/navigation') {
    return { redirect: () => { throw new Error('redirect called') } }
  }
  return originalLoad.apply(this, arguments)
}
