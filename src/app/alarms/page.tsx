"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

interface Parameter {
  id: string;
  name: string;
  unit: string;
}

interface Alarm {
  id: string;
  operator: string;
  triggerValue: number;
  actionName: string;
  status: string;
  parameterId: string;
  parameter: Parameter;
  createdAt: string;
}

interface LiveData {
  parameterId: string;
  value: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AlarmsPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [liveData, setLiveData] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isDataLocked, setIsDataLocked] = useState(false);
  const [lockInterval, setLockInterval] = useState('TWO_SECONDS');
  const [parameterId, setParameterId] = useState("");
  const [operator, setOperator] = useState("LT");
  const [triggerValue, setTriggerValue] = useState("");
  const [actionName, setActionName] = useState("");

  const { user } = useAuthStore();
  const isOperator = user?.role === "OPERATOR";

  useEffect(() => {
    fetchParameters();

    const socket = getSocket();
    
    socket.on("live-data", (data: LiveData[]) => {
      const dataMap: Record<string, number> = {};
      data.forEach(item => {
        dataMap[item.parameterId] = item.value;
      });
      setLiveData(dataMap);
    });

    socket.on("alarm-status-changed", ({ alarmId, status }: { alarmId: string, status: string }) => {
      setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, status } : a));
    });

    return () => {
      socket.off("live-data");
      socket.off("alarm-status-changed");
    };
  }, []);

  useEffect(() => {
    fetchAlarms(page);
  }, [page]);

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

  const fetchParameters = async () => {
    try {
      const res = await api.get("/alarms/parameters");
      setParameters(res.data.data);
      if (res.data.data.length > 0) {
        setParameterId(res.data.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch parameters", error);
    }
  };

  const fetchAlarms = async (pageNum: number) => {
    try {
      const res = await api.get(`/alarms?page=${pageNum}&limit=10`);
      setAlarms(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch alarms", error);
    }
  };

  const handleSetAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/alarms", {
        operator,
        triggerValue,
        actionName,
        parameterId
      });
      fetchAlarms(page);
      setTriggerValue("");
      setActionName("");
    } catch (error) {
      console.error("Failed to set alarm", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/alarms/${id}`);
      fetchAlarms(page);
    } catch (error) {
      console.error("Failed to delete alarm", error);
    }
  };

  const getOperatorSymbol = (op: string) => {
    switch(op) {
      case 'GT': return '>';
      case 'LT': return '<';
      case 'GTE': return '>=';
      case 'LTE': return '<=';
      case 'EQ': return '==';
      case 'NEQ': return '!=';
      default: return op;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Alarm Setup</h1>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Data Lock Interval</label>
            <select 
              value={lockInterval}
              onChange={(e) => setLockInterval(e.target.value)}
              disabled={isDataLocked}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-blue-500 outline-none text-gray-700"
            >
              <option value="TWO_SECONDS">2 Seconds</option>
              <option value="FIVE_SECONDS">5 Seconds</option>
            </select>
          </div>
          <button 
            onClick={toggleDataLock}
            disabled={isOperator}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md
              ${isOperator 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : isDataLocked 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
          >
            {isDataLocked ? 'Stop Lock' : 'Start Lock'}
          </button>
        </div>
      </div>

      {!isOperator && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
            Create New Alarm
          </h2>
          <form onSubmit={handleSetAlarm} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Parameter</label>
              <select 
                value={parameterId}
                onChange={(e) => setParameterId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-800"
              >
                {parameters.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Condition</label>
              <select 
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-800"
              >
                <option value="GT">Greater Than {'>'}</option>
                <option value="LT">Less Than {'<'}</option>
                <option value="GTE">Greater/Eq {'>='}</option>
                <option value="LTE">Less/Eq {'<='}</option>
                <option value="EQ">Equal {'=='}</option>
                <option value="NEQ">Not Equal {'!='}</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Value</label>
              <input 
                type="number" 
                required
                step="any"
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none font-mono text-gray-800"
                
              />
            </div>

            <div className="col-span-1 md:col-span-1">
               <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Action</label>
               <input 
                type="text" 
                required
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-800"
              />
            </div>

            <div className="col-span-1 md:col-span-1 flex justify-end">
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                Set Alarm
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Parameter</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Condition</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Live Value</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Action</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Time</th>
                {!isOperator && <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Delete</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {alarms.length === 0 ? (
                <tr>
                  <td colSpan={isOperator ? 6 : 7} className="p-8 text-center text-gray-500">
                    No alarms configured yet.
                  </td>
                </tr>
              ) : (
                alarms.map(alarm => {
                  const currentVal = liveData[alarm.parameterId];
                  const isTriggered = alarm.status === 'TRIGGERED';
                  
                  return (
                    <tr key={alarm.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-700 font-medium">
                        {alarm.parameter?.name}
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-mono border border-gray-200">
                          <span className="text-blue-600 font-bold">{getOperatorSymbol(alarm.operator)}</span> {alarm.triggerValue}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium">
                        {currentVal !== undefined ? (
                          <span className={isTriggered ? "text-red-500" : "text-green-600"}>
                            {currentVal.toFixed(2)} <span className="text-gray-500 text-xs">{alarm.parameter?.unit}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No value</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isTriggered ? (
                          <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                            TRIGGERED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-700 font-medium">{alarm.actionName}</td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(alarm.createdAt).toLocaleString()}
                      </td>
                      {!isOperator && (
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDelete(alarm.id)}
                            className="text-red-500 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-gray-700 font-medium"
              >
                Previous
              </button>
              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-gray-700 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
