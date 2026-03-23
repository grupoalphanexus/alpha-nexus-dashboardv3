import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet: any[]) {
          // aplica cookies na requisição
          cookiesToSet.forEach((cookie: any) => {
            request.cookies.set(cookie.name, cookie.value)
          })

          // recria resposta
          supabaseResponse = NextResponse.next({ request })

          // aplica cookies na resposta
          cookiesToSet.forEach((cookie: any) => {
            supabaseResponse.cookies.set(
              cookie.name,
              cookie.value,
              cookie.options
            )
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/auth')
  const isWebhook = path.startsWith('/api/webhook')

  // libera webhook
  if (isWebhook) return supabaseResponse

  // não logado → login
  if (!user && !isAuthPage && path !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // logado → dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
