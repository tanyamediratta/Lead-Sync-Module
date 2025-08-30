import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [platform, setPlatform] = useState("ALL"); // ALL | META | GOOGLE

  async function loadLeads() {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "20" });
      if (platform !== "ALL") params.set("platform", platform);
      const { data } = await axios.get(`${API_BASE}/api/leads?${params.toString()}`);
      setLeads(data.items ?? data);
    } catch (e) {
      console.error(e);
      setLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/logs`);
      setLogs(data);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function syncAll() {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/api/sync/all`);
      await Promise.all([loadLeads(), loadLogs()]);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadLeads();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]); // reload when filter changes

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Lead Sync Dashboard</h1>
          <button
            onClick={syncAll}
            disabled={syncing}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </header>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Platform:</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="border rounded-md px-3 py-2 bg-white"
          >
            <option value="ALL">All</option>
            <option value="META">META</option>
            <option value="GOOGLE">GOOGLE</option>
          </select>
        </div>

        {/* Leads Table */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-medium mb-3">Leads</h2>

          {loadingLeads ? (
            <div className="py-6 text-gray-500">Loading leads…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left border-b">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Platform</th>
                    <th className="py-2 pr-4">Campaign</th>
                    <th className="py-2 pr-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l._id} className="border-b last:border-none">
                      <td className="py-2 pr-4">{l.name || "-"}</td>
                      <td className="py-2 pr-4">{l.phone || "-"}</td>
                      <td className="py-2 pr-4">{l.email || "-"}</td>
                      <td className="py-2 pr-4">{l.platform}</td>
                      <td className="py-2 pr-4">{l.campaignName || l.campaignId || "-"}</td>
                      <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-3 text-gray-500">
                        No leads found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sync Logs */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-medium mb-3">Sync Logs</h2>
          {loadingLogs ? (
            <div className="py-4 text-gray-500">Loading logs…</div>
          ) : logs.length ? (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li key={log._id} className="flex justify-between border-b last:border-none py-2">
                  <span>{log.platform}</span>
                  <span>fetched: {log.fetchedCount} • imported: {log.importedCount}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No logs yet.</div>
          )}
        </section>
      </div>
    </div>
  );
}
