
import { NextResponse } from 'next/server';

export async function GET() {
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const jsonKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    return NextResponse.json({
        hasEmail: !!email,
        emailLength: email?.length || 0,
        hasPrivateKey: !!key,
        keyLength: key?.length || 0,
        keyFirstLine: key?.split('\n')[0] || 'N/A',
        keyLastLine: key?.trim().split('\n').pop() || 'N/A',
        keyContainsNewline: key?.includes('\n') || false,
        keyContainsEscapedNewline: key?.includes('\\n') || false,
        hasJsonKey: !!jsonKey,
        jsonKeyLength: jsonKey?.length || 0,
        envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE'))
    });
}
