'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BarChart3, Settings as SettingsIcon, PenLine, Sparkles } from 'lucide-react';

const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => (
    <Link href={href} className="flex flex-col items-center justify-center w-20 h-16 transition-all group">
        <Icon className={`w-5 h-5 mb-1 transition-colors ${active ? 'text-[#8294A5]' : 'text-stone-300 group-hover:text-stone-500'}`} />
        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${active ? 'text-[#8294A5]' : 'text-stone-300 group-hover:text-stone-400'}`}>{label}</span>
        {active && <div className="mt-1 w-1 h-1 bg-[#8294A5] rounded-full" />}
    </Link>
);

export default function Navbar() {
    const pathname = usePathname();

    return (
        <div className="fixed right-6 top-0 bottom-0 flex items-center z-[100] pointer-events-none">
            <nav className="flex flex-col items-center bg-white/80 backdrop-blur-3xl border border-white/40 rounded-full py-6 px-2 shadow-[20px_0_60px_rgba(0,0,0,0.05)] pointer-events-auto">
                <NavItem href="/" icon={Compass} label="Today" active={pathname === '/'} />
                <NavItem href="/dashboard" icon={BarChart3} label="Data" active={pathname === '/dashboard'} />
                <NavItem href="/patterns" icon={Sparkles} label="Lab" active={pathname === '/patterns'} />
                <NavItem href="/log" icon={PenLine} label="Logs" active={pathname === '/log'} />
                <NavItem href="/settings" icon={SettingsIcon} label="Set" active={pathname === '/settings'} />
            </nav>
        </div>
    );
}
