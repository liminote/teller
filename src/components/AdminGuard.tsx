'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.accountType !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5E2DB]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-stone-100 border-t-[#8294A5] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Verifying...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session.user.accountType === 'admin') {
    return <>{children}</>;
  }

  return null;
}
