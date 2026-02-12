import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      accountType: 'free' | 'paid' | 'admin';
      sheetId?: string;
      onboardingCompleted: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    sub?: string;
  }
}
