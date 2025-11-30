import { useEffect, useState, FormEvent } from 'react';
import { Send, Wallet, History, RefreshCw, Copy, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

interface VaultInfo {
  id: number;
  name: string;
  vault_address: string;
  on_chain_lovelace: number;
  on_chain_ada: number;
}

interface AgentPayment {
  id: number;
  merchant_address: string;
  amount_lovelace: number;
  tx_hash?: string | null;
  receipt_nft_asset_id?: string | null;
}

interface AgentPayResponse {
  agent_id: number;
  vault_address: string;
  merchant_address: string;
  amount_lovelace: number;
  tx_hash: string;
  receipt_nft_asset_id: string;
  reputation_score: number;
  new_vault_balance_lovelace: number;
  new_vault_balance_ada: number;
}

export default function Agents() {
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  const [payments, setPayments] = useState<AgentPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  // Payment form state
  const [merchantAddress, setMerchantAddress] = useState('');
  const [amountAda, setAmountAda] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<AgentPayResponse | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Load vault info and payments
  const fetchData = async () => {
    // Fetch vault info
    try {
      setVaultLoading(true);
      setVaultError(null);
      const res = await fetch(`${API_BASE}/api/agent/vault-info`);
      if (!res.ok) {
        throw new Error(`Vault info error: ${res.status}`);
      }
      const data: VaultInfo = await res.json();
      setVaultInfo(data);
    } catch (err: any) {
      console.error('Backend connection error:', err);
      setVaultError('Backend not running. Start backend at http://127.0.0.1:8000');
    } finally {
      setVaultLoading(false);
    }

    // Fetch payments
    try {
      setPaymentsLoading(true);
      setPaymentsError(null);
      const res = await fetch(`${API_BASE}/api/agent/payments`);
      if (!res.ok) {
        throw new Error(`Payments error: ${res.status}`);
      }
      const data: AgentPayment[] = await res.json();
      setPayments(data);
    } catch (err: any) {
      console.error('Backend connection error:', err);
      setPaymentsError('Backend not running. Start backend at http://127.0.0.1:8000');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle payment submission
  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    if (!merchantAddress.trim()) {
      setPaymentError('Please enter a merchant address');
      return;
    }

    const amount = parseFloat(amountAda);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount greater than 0');
      return;
    }

    const amountLovelace = Math.round(amount * 1_000_000);

    // Check sufficient balance
    if (vaultInfo && amountLovelace > vaultInfo.on_chain_lovelace) {
      setPaymentError(`Insufficient balance. Available: ${vaultInfo.on_chain_ada.toFixed(2)} ADA`);
      return;
    }

    try {
      setPaymentLoading(true);
      const res = await fetch(`${API_BASE}/api/agent/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_address: merchantAddress.trim(),
          amount_lovelace: amountLovelace,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Payment failed: ${res.status}`);
      }

      const data: AgentPayResponse = await res.json();
      setPaymentSuccess(data);

      // Update vault info with new balance
      if (vaultInfo) {
        setVaultInfo({
          ...vaultInfo,
          on_chain_lovelace: data.new_vault_balance_lovelace,
          on_chain_ada: data.new_vault_balance_ada,
        });
      }

      // Refresh payments list
      fetchData();

      // Clear form
      setMerchantAddress('');
      setAmountAda('');
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Quick amount buttons
  const setQuickAmount = (amount: number) => {
    setAmountAda(amount.toString());
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (vaultInfo?.vault_address) {
      try {
        await navigator.clipboard.writeText(vaultInfo.vault_address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F8F9FB] to-white py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1A1F25] mb-2">AI Agent Vault</h1>
          <p className="text-[#4F5765]">Autonomous payments powered by Cardano blockchain</p>
        </div>

        {/* Vault Info Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {vaultLoading ? 'Loading...' : vaultInfo?.name || 'Agent Vault'}
                </h2>
                <p className="text-blue-100 text-sm">Global Payment Agent</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={vaultLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw size={20} className={vaultLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {vaultError && (
            <div className="bg-red-500/20 border border-red-300 rounded-lg p-3 mb-4 text-sm">
              {vaultError}
            </div>
          )}

          {vaultInfo && (
            <>
              <div className="mb-6">
                <p className="text-blue-100 text-sm mb-1">Vault Balance</p>
                <p className="text-5xl font-bold">{vaultInfo.on_chain_ada.toFixed(2)} ADA</p>
                <p className="text-blue-200 text-sm mt-1">
                  {vaultInfo.on_chain_lovelace.toLocaleString()} lovelace
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-blue-100 text-xs mb-2">Vault Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono break-all flex-1">
                    {vaultInfo.vault_address}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    {copiedAddress ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Send className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1F25]">Send Payment</h3>
                <p className="text-sm text-[#4F5765]">Pay merchants from agent vault</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1F25] mb-2">
                  Merchant Address
                </label>
                <input
                  type="text"
                  value={merchantAddress}
                  onChange={(e) => setMerchantAddress(e.target.value)}
                  placeholder="addr_test1..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1F25] mb-2">
                  Amount (ADA)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={amountAda}
                  onChange={(e) => setAmountAda(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setQuickAmount(5)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    5 ADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAmount(10)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    10 ADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAmount(25)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    25 ADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAmount(50)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    50 ADA
                  </button>
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              )}

              {paymentSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm font-semibold text-green-700">Payment Successful!</p>
                  </div>
                  <div className="text-xs text-green-600 space-y-1 ml-6">
                    <p>Amount: {(paymentSuccess.amount_lovelace / 1_000_000).toFixed(2)} ADA</p>
                    <p className="font-mono break-all">Tx: {paymentSuccess.tx_hash.slice(0, 32)}...</p>
                    <p>New Balance: {paymentSuccess.new_vault_balance_ada.toFixed(2)} ADA</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={paymentLoading || vaultLoading || !vaultInfo}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Payment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <History className="text-purple-600" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1F25]">Recent Transactions</h3>
                <p className="text-sm text-[#4F5765]">Latest agent payments</p>
              </div>
            </div>

            {paymentsLoading && (
              <p className="text-sm text-[#4F5765] text-center py-8">Loading transactions...</p>
            )}

            {paymentsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {paymentsError}
              </div>
            )}

            {!paymentsLoading && !paymentsError && payments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[#4F5765] mb-2">No transactions yet</p>
                <p className="text-sm text-gray-400">Send your first payment above</p>
              </div>
            )}

            {payments.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {payments.slice(0, 10).reverse().map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-[#4F5765] mb-1">To Merchant</p>
                        <p className="text-sm font-mono text-[#1A1F25] break-all">
                          {payment.merchant_address.slice(0, 20)}...{payment.merchant_address.slice(-10)}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-lg font-bold text-blue-600">
                          {(payment.amount_lovelace / 1_000_000).toFixed(2)}
                        </p>
                        <p className="text-xs text-[#4F5765]">ADA</p>
                      </div>
                    </div>
                    {payment.tx_hash && (
                      <p className="text-xs text-gray-500 font-mono truncate">
                        Tx: {payment.tx_hash}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full Payment History Table */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-[#1A1F25] mb-4">Complete Payment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-[#4F5765]">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#4F5765]">Merchant</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#4F5765]">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#4F5765]">Transaction Hash</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#4F5765]">Receipt NFT</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr key={payment.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-[#4F5765]">{payment.id}</td>
                      <td className="px-4 py-3 font-mono text-xs break-all">
                        {payment.merchant_address.slice(0, 16)}...
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">
                        {(payment.amount_lovelace / 1_000_000).toFixed(6)} ADA
                      </td>
                      <td className="px-4 py-3 font-mono text-xs break-all">
                        {payment.tx_hash || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs break-all">
                        {payment.receipt_nft_asset_id ? 
                          payment.receipt_nft_asset_id.slice(0, 20) + '...' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}