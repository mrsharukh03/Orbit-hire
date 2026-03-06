import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    const token = request.cookies.get('accessToken')?.value

    // 🔴 Ye line add karo terminal me output dekhne ke liye
    console.log(`[MIDDLEWARE RUNNING] Path: ${path} | Token exists: ${!!token}`)

    const isAuthRoute = path === '/login' || path === '/signup'

    const isProtectedRoute =
        path.startsWith('/dashboard') ||
        path.startsWith('/profile') ||
        path.startsWith('/seeker') ||
        path.startsWith('/recruiter') ||
        path.startsWith('/admin') ||
        path === '/saved-jobs'

    if (isProtectedRoute && !token) {
        console.log("Redirecting to login...") // 🔴 Debugging line
        return NextResponse.redirect(new URL('/login', request.nextUrl))
    }

    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}