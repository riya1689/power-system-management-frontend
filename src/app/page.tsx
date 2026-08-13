"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface LiveData {
  parameterId: string;
  name: string;
  unit: string;
  value: number;
  timestamp: string;
}

export default function Dashboard() {
  const [data, setData] = useState<LiveData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDataLocked, setIsDataLocked] = useState(false);
  const [lockInterval, setLockInterval] = useState('TWO_SECONDS');
  const { user } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('live-data', (newData: LiveData[]) => {
      setData(newData);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('live-data');
    };
  }, []);

  const toggleDataLock = async () => {
    try {
      if (isDataLocked) {
        await api.post('/datalock/stop');
        setIsDataLocked(false);
      } else {
        await api.post('/datalock/start', { interval: lockInterval });
        setIsDataLocked(true);
      }
    } catch (error) {
      console.error("Failed to toggle data lock", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Power System Live Monitoring</h1>
          </div>
        </header>

        <div className="flex items-center gap-3 mb-8">
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div 
              key={item.parameterId} 
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-500 font-medium text-sm tracking-wide uppercase">{item.name}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 tracking-tight font-mono group-hover:text-blue-600 transition-colors">
                  {item.value.toFixed(2)}
                </span>
                <span className="text-gray-400 font-semibold">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
        
        {data.length === 0 && isConnected && (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Initializing parameters...</p>
          </div>
        )}
      </div>
    </div>
  );
}
