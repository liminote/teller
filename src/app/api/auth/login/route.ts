import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const correctPassword = process.env.SITE_PASSWORD;

        const trimmedPassword = password?.trim();
        const trimmedCorrect = correctPassword?.trim();

        console.log(`[Login] Attempt - Received: "${trimmedPassword?.substring(0, 2)}...", Expected: "${trimmedCorrect?.substring(0, 2)}...", Length match: ${trimmedPassword?.length === trimmedCorrect?.length}`);

        if (!trimmedCorrect) {
            return NextResponse.json({ error: '系統未設定密碼，請聯繫管理員' }, { status: 500 });
        }

        if (trimmedPassword === trimmedCorrect) {
            // 驗證成功，設定 Cookie
            const response = NextResponse.json({ success: true });

            // 在 Next.js 15/16 中，建議直接在 response 上設定 cookies，或者使用 await cookies()
            response.cookies.set('site_auth', 'authenticated', {
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
