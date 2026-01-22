import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 排除登入頁面、所有 API 路由以及靜態檔案
    if (
        pathname === '/login' ||
        pathname.startsWith('/api') ||  // 讓所有 API 路由都不需要認證
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

// 設定哪些路徑需要執行 middleware/proxy
export const config = {
    matcher: [
        /*
         * 匹配所有路徑，除了特定的靜態檔案
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
