import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Wallet, WalletTransaction } from "@/types/database";

export interface WalletSummary {
  wallet: Wallet;
  transactions: WalletTransaction[];
  totalEarned: number;
  totalSpent: number;
}

export async function getWalletSummary(
  eventId: string,
  profileId: string
): Promise<WalletSummary> {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profileId)
      .single();

    const { data: transactions } = await supabaseAdmin
      .from("wallet_transactions")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    const txs: WalletTransaction[] = transactions || [];
    const totalEarned = txs
      .filter((t) => t.type === "earn" || t.type === "initial_credit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = txs
      .filter((t) => t.type === "spend" || t.type === "reward_redemption")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      wallet: wallet || {
        id: "",
        event_id: eventId,
        profile_id: profileId,
        balance: 0,
        version: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      transactions: txs,
      totalEarned,
      totalSpent,
    };
  }

  // In-Memory store
  const key = `${eventId}:${profileId}`;
  let wallet = mockDb.wallets.get(key);
  if (!wallet) {
    mockDb.creditInitialWallet(eventId, profileId, 500);
    wallet = mockDb.wallets.get(key)!;
  }

  const txs = mockDb.walletTransactions.filter(
    (t) => t.event_id === eventId && t.profile_id === profileId
  );

  const totalEarned = txs
    .filter((t) => t.type === "earn" || t.type === "initial_credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = txs
    .filter((t) => t.type === "spend" || t.type === "reward_redemption")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    wallet,
    transactions: txs,
    totalEarned,
    totalSpent,
  };
}

export async function spendCoinsAtomic(
  eventId: string,
  profileId: string,
  amount: number,
  sourceType: string,
  sourceId: string | null,
  idempotencyKey?: string | null,
  metadata?: Record<string, any>
) {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc("fn_spend_wallet_atomic", {
      p_event_id: eventId,
      p_profile_id: profileId,
      p_amount: amount,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_idempotency_key: idempotencyKey,
      p_metadata: metadata || {},
    });
    if (error) throw error;
    return data;
  }

  return mockDb.spendWalletAtomic(
    eventId,
    profileId,
    amount,
    sourceType,
    sourceId,
    idempotencyKey,
    metadata
  );
}

export async function reconcileWallet(eventId: string, profileId: string) {
  const summary = await getWalletSummary(eventId, profileId);
  const calculatedBalance = summary.totalEarned - summary.totalSpent;
  const isReconciled = calculatedBalance === summary.wallet.balance;

  return {
    profileId,
    currentBalance: summary.wallet.balance,
    calculatedBalance,
    isReconciled,
    totalTransactions: summary.transactions.length,
  };
}
