'use client';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

interface HeaderProps {
  userId: string;
  setUserId: (id: string) => void;
}

export function Header({ userId, setUserId }: HeaderProps) {
  return (
    <header className="border-b border-[#1f293d] bg-[#0c101b]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Cpu size={22} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            VIGILANCE <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs text-gray-400 tracking-wider font-semibold uppercase">Early Warning Credit Risk System</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* User Selection selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase font-semibold">Active Profile:</span>
          <select 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-[#131926] border border-[#1f293d] rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="user_123">User 123 (Seeded Profile)</option>
            <option value="sandbox_user_001">Sandbox User 001</option>
            <option value="user_demo_high_risk">User 456 (High Stress)</option>
          </select>
        </div>

        {/* Live Engine Status indicator */}
        <div className="flex items-center gap-2 bg-[#131926] border border-[#1f293d] px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-gray-300 font-mono font-semibold uppercase tracking-wider">ENGINE OK</span>
        </div>
      </div>
    </header>
  );
}
