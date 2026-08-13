"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePathname, useRouter } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const isAuthPage = pathname === "/login" || pathname === "/register";
      if (!token && !isAuthPage) {
        router.push("/login");
      }
    }
  }, [mounted, token, pathname, router]);

  if (!mounted) return null;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {!isAuthPage && user && (
        <nav className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex gap-6 items-center">
              <span className="font-bold text-xl text-blue-600 mr-4 tracking-tight">PSM</span>
              <a href="/" className={`font-semibold transition-colors ${pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>Dashboard</a>
              <a href="/alarms" className={`font-semibold transition-colors ${pathname === '/alarms' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>Alarm Setup</a>
              <a href="/history" className={`font-semibold transition-colors ${pathname === '/history' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>Historical Data</a>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <span className="text-sm font-medium text-gray-700">{user.name} <span className="text-xs text-gray-500 uppercase">({user.role})</span></span>
              </div>
              <button 
                onClick={() => { logout(); router.push('/login'); }}
                className="text-gray-500 hover:text-red-500 font-medium text-sm transition-colors px-2"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}
      <div className="flex-1 bg-gray-50">
        {(!isAuthPage && !token) ? null : children}
      </div>
    </>
  );
}
