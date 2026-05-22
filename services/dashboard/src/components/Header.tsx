'use client';
import { Cpu } from 'lucide-react';
import { useCustomer } from '@/context/CustomerContext';
import { getSeverityColor } from '@/lib/customers';
import { Nav } from '@/components/Nav';

export function Header() {
  const { selectedCustomer, setSelectedCustomer, allCustomers } = useCustomer();

  return (
    <header className="border-b border-[#1f293d] bg-[#0c101b]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center">
        {/* Logo */}
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

        {/* Nav Links */}
        <Nav />
      </div>

      <div className="flex items-center gap-4">
        {/* Customer Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase font-semibold">Active Profile:</span>
          <div className="relative">
            <select
              value={selectedCustomer.id}
              onChange={(e) => {
                const found = allCustomers.find(c => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
              className="bg-[#131926] border border-[#1f293d] rounded-lg pl-8 pr-3 py-1.5 text-sm font-semibold text-gray-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer appearance-none"
            >
              {allCustomers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </option>
              ))}
            </select>
            {/* Severity dot overlay */}
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
              style={{ backgroundColor: getSeverityColor(selectedCustomer.severity) }}
            />
          </div>
        </div>

        {/* Live Engine Status */}
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
