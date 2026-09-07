import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import { QRScannerClient } from "@/components/attendee/qr-scanner";
import { QrCode } from "lucide-react";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(
    session.eventId,
    session.profile.id
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <QrCode className="w-5 h-5 text-blue-400" />
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">
            Scan Event Checkpoint
          </h1>
          <p className="text-xs text-slate-400">
            Scan physical zone signboards to unlock missions & rewards
          </p>
        </div>
      </div>

      <QRScannerClient
        initialCode={searchParams.code || ""}
        userBalance={walletSummary.wallet.balance}
      />
    </div>
  );
}
