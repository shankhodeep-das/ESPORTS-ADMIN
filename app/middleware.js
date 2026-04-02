import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req) {
  const res = NextResponse.next()

  // Allow overlays always
  if (req.nextUrl.pathname.startsWith('/overlay')) {
    return res
  }

  // Allow login page always
  if (req.nextUrl.pathname.startsWith('/login')) {
    return res
  }

  // Check for session cookie
  const token = req.cookies.get('sb-access-token')?.value ||
                req.cookies.get('sb-refresh-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}