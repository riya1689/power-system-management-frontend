"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Parameter {
  id: string;
  name: string;
  unit: string;
}

interface DataLog {
  id: string;
  value: number;
  timestamp: string;
  parameterId: string;
  parameter: Parameter;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function HistoryPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [logs, setLogs] = useState<DataLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Filter state
  const [parameterId, setParameterId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // View state
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchParameters();
  }, []);

  // Fetch whenever page changes
  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchParameters = async () => {
    try {
      const res = await api.get("/alarms/parameters");
      setParameters(res.data.data);
    } catch (error) {
      console.error("Failed to fetch parameters", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });
      if (parameterId) params.append("parameterId", parameterId);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const res = await api.get(`/history?${params.toString()}`);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch historical data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page === 1) {
      fetchData();
    } else {
      setPage(1); // Will trigger fetchData via useEffect
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (parameterId) params.append("parameterId", parameterId);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const res = await api.get(`/history/export?${params.toString()}`);
      const exportLogs: DataLog[] = res.data.data;

      // Generate CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Time,Parameter,Value,Unit\n";
      
      exportLogs.forEach((log) => {
        const time = new Date(log.timestamp).toLocaleString();
        const row = `"${time}","${log.parameter.name}","${log.value}","${log.parameter.unit}"`;
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `scada_history_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to export data", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historical Data</h1>
        </div>
        
        <button 
          onClick={handleExportCSV}
          disabled={exporting || logs.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          {exporting ? "Exporting..." : "Export to Excel/CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1">
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Parameter</label>
            <select 
              value={parameterId}
              onChange={(e) => setParameterId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-700"
            >
              <option value="">All Parameters</option>
              {parameters.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Start Date & Time</label>
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-700"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">End Date & Time</label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-700"
            />
          </div>

          <div className="col-span-1">
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Date & Time</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Parameter</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Value</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Unit</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    Loading data...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No historical data found. Try adjusting filters.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-700 font-medium">
                      {log.parameter.name}
                    </td>
                    <td className="p-4 font-mono text-blue-600 font-medium">
                      {log.value.toFixed(2)}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {log.parameter.unit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-700">{pagination.total}</span> entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-gray-700 font-medium"
              >
                Previous
              </button>
              
              <span className="text-sm font-medium text-gray-700 px-3">
                Page {page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
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
