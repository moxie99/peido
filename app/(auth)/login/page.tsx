'use client'

import { useActionState, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { login } from '@/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <main className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-700 via-green-600 to-green-800 relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1920&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-700/90 via-green-600/85 to-green-800/95" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-white text-xl font-semibold">Peido</span>
            </div>
            {/* Theme toggle on login */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Track your chicken<br />farm profitability
            </h1>
            <p className="text-green-100 text-lg max-w-md">
              Monitor feed costs, track egg production, and understand your farm financial performance.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-green-200 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              <span>Real-time analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Feed tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span>Daily logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <span className="text-2xl font-semibold text-gray-800 dark:text-white">Peido</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to access your dashboard</p>
          </div>

          <form action={action} className="mt-8 space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email"
                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="block w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {state?.message && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-green-600/25"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Peido &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  )
}
