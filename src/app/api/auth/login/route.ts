import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const correctPassword = process.env.SITE_PASSWORD;

        if (!correctPassword) {
            return NextResponse.json({ error: '系統未設定密碼，請聯繫管理員' }, { status: 500 });
        }

        if (password === correctPassword) {
            // 驗證成功，設定 Cookie
            const response = NextResponse.json({ success: true });

            // 設定一個有效期為 30 天的 Cookie
            (await cookies()).set('site_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
    }
}
