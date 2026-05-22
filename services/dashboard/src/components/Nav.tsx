'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, BarChart2, CalendarClock } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/comparison', label: 'Comparison', icon: BarChart2 },
  { href: '/emi-forecast', label: 'EMI Forecast', icon: CalendarClock },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 ml-6">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              active
                ? 'bg-[#1a2640] text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#131926]'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
