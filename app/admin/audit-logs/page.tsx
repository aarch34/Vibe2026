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
          <h1 className="text-2xl font-black text-foreground tracking-tight font-mono">
            Security & Operations Audit Logs
          </h1>
          <p className="text-xs text-muted-foreground font-bold">
            Immutable system logs for administrative changes and wallet operations
          </p>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo">
        {auditLogs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs font-bold font-mono">
            No administrative mutations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b-2 border-border text-muted-foreground uppercase text-[11px]">
                  <th className="pb-3 font-black">Timestamp</th>
                  <th className="pb-3 font-black">Action</th>
                  <th className="pb-3 font-black">Entity Type</th>
                  <th className="pb-3 font-black">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted transition-colors">
                    <td className="py-3 font-mono text-muted-foreground font-bold">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono font-black text-primary">
                      {log.action}
                    </td>
                    <td className="py-3 font-mono font-bold text-foreground">
                      {log.entity_type}
                    </td>
                    <td className="py-3 text-muted-foreground font-mono text-[11px] font-bold">
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
