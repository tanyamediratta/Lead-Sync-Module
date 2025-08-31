import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";
import { useRef } from "react";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [platform, setPlatform] = useState("ALL"); // ALL | META | GOOGLE
  const [toast, setToast] = useState(null);
  const isSyncingRef = useRef(false);



  // Auto-sync state (persisted)
const AUTO_SYNC_KEY = "autoSyncEnabled";
const [autoSync, setAutoSync] = useState(
  () => localStorage.getItem(AUTO_SYNC_KEY) === "true"
);
const [lastSyncedAt, setLastSyncedAt] = useState(null);

function toggleAutoSync(val) {
  setAutoSync(val);
  localStorage.setItem(AUTO_SYNC_KEY, String(val));
}


  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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
      showToast("⚠️ Failed to load leads");
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
      showToast("⚠️ Failed to load logs");
    } finally {
      setLoadingLogs(false);
    }
  }

  async function syncAll() {
  if (isSyncingRef.current) return;          // guard: skip if already running
  isSyncingRef.current = true;
  setSyncing(true);
  try {
    const { data } = await axios.post(`${API_BASE}/api/sync/all`);
    await Promise.all([loadLeads(), loadLogs()]);
    const imported = (data?.meta?.imported ?? 0) + (data?.google?.imported ?? 0);
    showToast(`✅ Sync complete • imported: ${imported}`);
    setLastSyncedAt(new Date());
  } catch (err) {
    console.error(err);
    showToast("❌ Sync failed, check console");
  } finally {
    isSyncingRef.current = false;
    setSyncing(false);
  }
}



  useEffect(() => {
    loadLeads();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  useEffect(() => {
  if (!autoSync) return;

  const FIVE_MIN = 5 * 60 * 1000;
  // Kick off one sync immediately when toggled on
  syncAll();

  const id = setInterval(() => {
    // If a sync is already running, skip this tick
    if (!isSyncingRef.current) syncAll();
  }, FIVE_MIN);

  return () => clearInterval(id);
  // IMPORTANT: don't include `syncing` or `syncAll` here
}, [autoSync]); // only depends on the toggle


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with subtle professional gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold text-white drop-shadow-sm">
              Lead Sync Dashboard
            </h1>
            <button
            onClick={syncAll}
            disabled={syncing}
            className="px-5 py-2 rounded-lg font-medium
            bg-white text-indigo-700 border-2 border-white 
            shadow hover:bg-indigo-50 disabled:opacity-50 transition"
            >
            {syncing ? "Syncing..." : "Sync Now"}
            </button>

          </header>

          {/* Controls */}
          {/* Controls */}
<div className="mt-4 flex items-center gap-4 flex-wrap">
  <div className="flex items-center gap-3">
    <label className="text-sm text-indigo-50/90">Platform</label>
    <select
      value={platform}
      onChange={(e) => setPlatform(e.target.value)}
      className="border border-white/30 bg-white/95 text-gray-800 rounded-md px-3 py-2
                 shadow-sm focus:outline-none"
    >
      <option value="ALL">All</option>
      <option value="META">META</option>
      <option value="GOOGLE">GOOGLE</option>
    </select>
  </div>

  {/* Auto Sync toggle */}
  <label className="flex items-center gap-2 text-indigo-50/90 text-sm select-none">
    <input
      type="checkbox"
      className="h-4 w-4 accent-purple-500"
      checked={autoSync}
      onChange={(e) => toggleAutoSync(e.target.checked)}
    />
    Auto Sync (5 min)
  </label>

  {/* Last synced time */}
  {lastSyncedAt && (
    <span className="text-indigo-50/80 text-xs">
      Last synced: {lastSyncedAt.toLocaleTimeString()}
    </span>
  )}
</div>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Leads Card */}
        <section className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Leads</h2>
            {loadingLeads && (
              <span className="text-sm text-gray-500 animate-pulse">Loading leads…</span>
            )}
          </div>

          {!loadingLeads ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left border-b">
                  <tr className="text-gray-600">
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
                    <tr
                      key={l._id}
                      className="border-b last:border-none hover:bg-indigo-50/60 transition"
                    >
                      <td className="py-2 pr-4">{l.name || "-"}</td>
                      <td className="py-2 pr-4">{l.phone || "-"}</td>
                      <td className="py-2 pr-4">{l.email || "-"}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium
                                         bg-indigo-100 text-indigo-700">
                          {l.platform}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{l.campaignName || l.campaignId || "-"}</td>
                      <td className="py-2 pr-4">
                        {l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-5 text-center text-gray-500">
                        No leads found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {/* Logs Card */}
        <section className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Sync Logs</h2>
            {loadingLogs && (
              <span className="text-sm text-gray-500 animate-pulse">Loading logs…</span>
            )}
          </div>

          {!loadingLogs ? (
            logs.length ? (
              <ul className="space-y-2 text-sm">
                {logs.map((log) => (
                  <li
                    key={log._id}
                    className="flex flex-wrap gap-2 justify-between items-center px-3 py-2 rounded-lg
                               bg-gray-50 hover:bg-indigo-50 transition border"
                  >
                    <span className="font-medium text-indigo-700">{log.platform}</span>
                    <span className="text-gray-600">
                      fetched: {log.fetchedCount} • imported: {log.importedCount}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No logs yet.</div>
            )
          ) : null}
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 bg-indigo-600 text-white px-4 py-2
                     rounded-lg shadow-lg animate-fadeIn"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
