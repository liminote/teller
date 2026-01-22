import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 排除登入頁面、API 路由（auth 相關）以及靜態檔案
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') || // 圖片、圖標等
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // 檢查是否有 site_auth cookie
    const authCookie = request.cookies.get('site_auth');

    if (!authCookie || authCookie.value !== 'authenticated') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';

        // 保存原本想去的頁面，登入後可以導回去
        if (pathname !== '/') {
            url.searchParams.set('from', pathname);
        }

        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// 設定哪些路徑需要執行 middleware
export const config = {
    matcher: [
        /*
         * 匹配所有路徑，除了：
         * 1. /api (API 路由，通常我們在裡面的路由獨立處理，或統一處理)
         * 2. /_next (Next.js 內部檔案)
         * 3. /static (靜態檔案)
         * 4. favicon.ico, sitemap.xml, robots.txt 等
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
