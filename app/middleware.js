import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  if (req.nextUrl.pathname.startsWith('/overlay')) return res
  if (req.nextUrl.pathname.startsWith('/login')) return res

  const token = req.cookies.get('sb-access-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}