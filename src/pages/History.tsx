import { useState } from 'react';

const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

interface HistoryProps {
  walletAddress: string | null;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface Reputation {
  address: string;
  score: number;
}

interface Receipt {
  tx_hash: string;
  payer_address: string;
  merchant_address: string;
  amount_lovelace: number;
  nft_asset_id?: string | null;
}

interface Invoice {
  invoice_id: string;
  merchant_address: string;
  customer_address?: string | null;
  amount_lovelace: number;
  description?: string | null;
  status: string;
  nft_asset_id?: string | null;
}

export default function History({ walletAddress, onShowToast }: HistoryProps) {
  const [mode, setMode] = useState<'user' | 'merchant'>('user');

  // user view state
  const [userAddr, setUserAddr] = useState('');
  const [userRep, setUserRep] = useState<Reputation | null>(null);
  const [userReceipts, setUserReceipts] = useState<Receipt[]>([]);

  // merchant view state
  const [merchantAddr, setMerchantAddr] = useState('');
  const [merchantReceipts, setMerchantReceipts] = useState<Receipt[]>([]);
  const [merchantInvoices, setMerchantInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const loadUserHistory = async () => {
    setErr('');
    setUserRep(null);
    setUserReceipts([]);
    const addr = userAddr || walletAddress;
    if (!addr) {
      setErr('Enter a user address or connect wallet.');
      return;
    }

    setLoading(true);
    try {
      const repRes = await fetch(`${API_BASE}/reputation/${addr}`);
      if (!repRes.ok) throw new Error('Failed to load reputation');
      const repJson = await repRes.json();

      const recRes = await fetch(`${API_BASE}/receipts/by-user/${addr}`);
      if (!recRes.ok) throw new Error('Failed to load receipts');
      const recJson = await recRes.json();

      setUserRep(repJson);
      setUserReceipts(recJson);
      onShowToast('Loaded user history', 'success');
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Error loading user history';
      setErr(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMerchantHistory = async () => {
    setErr('');
    setMerchantReceipts([]);
    setMerchantInvoices([]);
    if (!merchantAddr) {
      setErr('Enter merchant address.');
      return;
    }

    setLoading(true);
    try {
      const recRes = await fetch(
        `${API_BASE}/receipts/by-merchant/${merchantAddr}`
      );
      if (!recRes.ok) throw new Error('Failed to load receipts');
      const recJson = await recRes.json();

      const invRes = await fetch(`${API_BASE}/invoices/${merchantAddr}`);
      if (!invRes.ok) throw new Error('Failed to load invoices');
      const invJson = await invRes.json();

      setMerchantReceipts(recJson);
      setMerchantInvoices(invJson);
      onShowToast('Loaded merchant history', 'success');
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Error loading merchant history';
      setErr(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">History & Reputation</h1>
      <p className="text-gray-600 mb-6">
        Explore receipts and reputation for users and merchants based on on-chain payments and
        VibeChain receipts.
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setMode('user')}
          className={`px-4 py-2 text-sm rounded ${
            mode === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          User View
        </button>
        <button
          onClick={() => setMode('merchant')}
          className={`px-4 py-2 text-sm rounded ${
            mode === 'merchant'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          Merchant View
        </button>
      </div>

      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      {mode === 'user' ? (
        <section className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold mb-2">User History</h2>
            <p className="text-xs text-gray-500 mb-3">
              If your wallet is connected, leave the field empty to use that identity. Otherwise,
              paste any address that has used VibeChain.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={userAddr}
                onChange={(e) => setUserAddr(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder={
                  walletAddress
                    ? 'Leave empty to use connected wallet identity'
                    : 'Enter user address...'
                }
              />
              <button
                onClick={loadUserHistory}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Load User History'}
              </button>
            </div>

            {userRep && (
              <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
                <p>
                  Address: <span className="font-mono break-all">{userRep.address}</span>
                </p>
                <p className="mt-1">
                  Reputation Score:{' '}
                  <span className="font-semibold">{userRep.score}</span>
                </p>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">User Receipts</h3>
            {userReceipts.length === 0 ? (
              <p className="text-sm text-gray-500">No receipts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">TX Hash</th>
                      <th className="px-2 py-1 text-left">Merchant</th>
                      <th className="px-2 py-1 text-right">Amount (ADA)</th>
                      <th className="px-2 py-1 text-left">NFT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReceipts.map((r) => (
                      <tr key={r.tx_hash} className="border-t">
                        <td className="px-2 py-1 font-mono break-all">
                          {r.tx_hash.slice(0, 24)}...
                        </td>
                        <td className="px-2 py-1 font-mono break-all">
                          {r.merchant_address.slice(0, 16)}...
                        </td>
                        <td className="px-2 py-1 text-right">
                          {r.amount_lovelace / 1_000_000}
                        </td>
                        <td className="px-2 py-1 font-mono break-all">
                          {r.nft_asset_id ? r.nft_asset_id.slice(0, 24) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold mb-2">Merchant History</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={merchantAddr}
                onChange={(e) => setMerchantAddr(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Merchant address (Cardano testnet)..."
              />
              <button
                onClick={loadMerchantHistory}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Load Merchant History'}
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Merchant Receipts</h3>
            {merchantReceipts.length === 0 ? (
              <p className="text-sm text-gray-500">No receipts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">TX Hash</th>
                      <th className="px-2 py-1 text-left">Payer</th>
                      <th className="px-2 py-1 text-right">Amount (ADA)</th>
                      <th className="px-2 py-1 text-left">NFT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchantReceipts.map((r) => (
                      <tr key={r.tx_hash} className="border-t">
                        <td className="px-2 py-1 font-mono break-all">
                          {r.tx_hash.slice(0, 24)}...
                        </td>
                        <td className="px-2 py-1 font-mono break-all">
                          {r.payer_address.slice(0, 16)}...
                        </td>
                        <td className="px-2 py-1 text-right">
                          {r.amount_lovelace / 1_000_000}
                        </td>
                        <td className="px-2 py-1 font-mono break-all">
                          {r.nft_asset_id ? r.nft_asset_id.slice(0, 24) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Merchant Invoices</h3>
            {merchantInvoices.length === 0 ? (
              <p className="text-sm text-gray-500">No invoices found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Invoice ID</th>
                      <th className="px-2 py-1 text-left">Customer</th>
                      <th className="px-2 py-1 text-right">Amount (ADA)</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-left">NFT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchantInvoices.map((inv) => (
                      <tr key={inv.invoice_id} className="border-t">
                        <td className="px-2 py-1 font-mono break-all">
                          {inv.invoice_id}
                        </td>
                        <td className="px-2 py-1 font-mono break-all">
                          {inv.customer_address
                            ? inv.customer_address.slice(0, 16) + '...'
                            : '-'}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {inv.amount_lovelace / 1_000_000}
                        </td>
                        <td className="px-2 py-1">{inv.status}</td>
                        <td className="px-2 py-1 font-mono break-all">
                          {inv.nft_asset_id ? inv.nft_asset_id.slice(0, 24) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
