import { useEffect, useState } from 'react';

const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

interface MerchantDashboardProps {
  walletAddress: string | null;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface Receipt {
  tx_hash: string;
  payer_address: string;
  merchant_address: string;
  amount_lovelace: number;
  nft_asset_id?: string | null;
}

interface ReputationResponse {
  address: string;
  score: number;
}

export default function MerchantDashboard({
  walletAddress,
  onShowToast,
}: MerchantDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [reputation, setReputation] = useState<ReputationResponse | null>(null);
  const [error, setError] = useState('');

  const merchantAddress = walletAddress; // treat connected wallet as merchant identity

  const loadData = async () => {
    if (!merchantAddress) return;
    setLoading(true);
    setError('');

    try {
      // fetch reputation
      const repRes = await fetch(
        `${API_BASE}/reputation/${encodeURIComponent(merchantAddress)}`
      );
      const repText = await repRes.text();
      if (!repRes.ok) {
        throw new Error(repText || 'Failed to load reputation');
      }
      const repJson = JSON.parse(repText) as ReputationResponse;
      setReputation(repJson);

      // fetch receipts for this merchant
      const recRes = await fetch(
        `${API_BASE}/receipts/by-merchant/${encodeURIComponent(merchantAddress)}`
      );
      const recText = await recRes.text();
      if (!recRes.ok) {
        throw new Error(recText || 'Failed to load receipts');
      }
      const recJson = JSON.parse(recText) as Receipt[];
      setReceipts(recJson);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Error loading dashboard data';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (merchantAddress) {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantAddress]);

  // derived stats
  const totalReceipts = receipts.length;
  const totalVolumeAda =
    receipts.reduce((sum, r) => sum + (r.amount_lovelace || 0), 0) / 1_000_000;

  const avgTicketAda =
    totalReceipts > 0 ? totalVolumeAda / totalReceipts : 0;

  const tier =
    (reputation?.score ?? 0) >= 15
      ? 'Gold'
      : (reputation?.score ?? 0) >= 5
      ? 'Silver'
      : (reputation?.score ?? 0) > 0
      ? 'Bronze'
      : 'Unrated';

  if (!merchantAddress) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Merchant Dashboard</h1>
        <p className="text-gray-600">
          Connect your wallet first. The connected address will be used as your
          merchant identity to show receipts and reputation.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            Overview of your verified payments and reputation on VibeChain.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4 text-xs text-gray-700 break-all">
        Merchant address:{' '}
        <span className="font-mono">{merchantAddress}</span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Top stats cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Reputation Score</div>
          <div className="text-2xl font-bold">
            {reputation ? reputation.score.toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Tier:{' '}
            <span className="font-semibold">
              {tier}
            </span>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Total Receipts</div>
          <div className="text-2xl font-bold">{totalReceipts}</div>
          <div className="text-xs text-gray-600 mt-1">
            Verified payments recorded.
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Total Volume (ADA)</div>
          <div className="text-2xl font-bold">
            {totalVolumeAda.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Sum of all verified receipts.
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Average Ticket (ADA)</div>
          <div className="text-2xl font-bold">
            {avgTicketAda.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Average size per verified payment.
          </div>
        </div>
      </section>

      {/* Recent receipts table */}
      <section className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Recent Receipts</h2>
          <span className="text-xs text-gray-500">
            Showing latest {Math.min(receipts.length, 10)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Tx Hash
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Payer
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Amount (ADA)
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Receipt NFT
                </th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    No receipts recorded yet.
                  </td>
                </tr>
              ) : (
                receipts
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((r) => (
                    <tr key={r.tx_hash} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono break-all">
                        {r.tx_hash}
                      </td>
                      <td className="px-3 py-2 font-mono break-all">
                        {r.payer_address}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(r.amount_lovelace / 1_000_000).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 font-mono break-all">
                        {r.nft_asset_id || '—'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
