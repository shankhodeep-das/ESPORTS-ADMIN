import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isOverlay = req.nextUrl.pathname.startsWith('/overlay')

  // Allow overlays always (for OBS/browser)
  if (isOverlay) return res

  // Allow login page always
  if (isLoginPage) return res

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
