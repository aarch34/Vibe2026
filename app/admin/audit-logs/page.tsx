import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { FileText, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let auditLogs: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(50);
    auditLogs = data || [];
  } else {
    auditLogs = mockDb.auditLogs;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Security & Operations Audit Logs
          </h1>
          <p className="text-sm text-slate-400">
            Immutable system logs for administrative changes and wallet operations
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        {auditLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No administrative mutations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entity Type</th>
                  <th className="pb-3">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">
                      {log.action}
                    </td>
                    <td className="py-3 font-mono text-cyan-400">
                      {log.entity_type}
                    </td>
                    <td className="py-3 text-slate-300 font-mono text-[11px]">
                      {log.after_data
                        ? JSON.stringify(log.after_data)
                        : "System initialized"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
