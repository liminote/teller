import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // TODO: Phase 2 完整實作 — Firebase 設定好後，在這裡：
        // 1. 檢查使用者是否已存在於 Firestore
        // 2. 新使用者 → 建立 Firestore 文件
        // 3. 儲存 access_token / refresh_token
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // TODO: Phase 2 完整實作 — 從 Firestore 讀取：
        // session.user.accountType = userData.accountType;
        // session.user.sheetId = userData.sheetId;
        // session.user.onboardingCompleted = userData.onboardingCompleted;

        // 暫時預設值（Firebase 設定好後會替換）
        session.user.accountType = 'free';
        session.user.onboardingCompleted = false;
      }
      return session;
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};
