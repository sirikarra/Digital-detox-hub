import { useEffect, useState } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

interface MintReceiptResponse {
  tx_hash: string;
  nft_asset_id?: string | null;
  reputation_score: number;
}

interface VaultInfo {
  id: number;
  name: string;
  vault_address: string;
  on_chain_lovelace: number;
  on_chain_ada: number;
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

function PayAndVerify() {
  // ---------- Manual pay section ----------
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualAmountAda, setManualAmountAda] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('eternl');
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  // ---------- Verify / Mint section ----------
  const [verifyTxHash, setVerifyTxHash] = useState('');
  const [verifyPayerAddress, setVerifyPayerAddress] = useState('');
  const [verifyMerchantAddress, setVerifyMerchantAddress] = useState('');
  const [verifyAmountAda, setVerifyAmountAda] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<MintReceiptResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // ---------- Agent vault section ----------
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  const [agentMerchant, setAgentMerchant] = useState('');
  const [agentAmountAda, setAgentAmountAda] = useState('');
  const [agentPayLoading, setAgentPayLoading] = useState(false);
  const [agentPayError, setAgentPayError] = useState<string | null>(null);
  const [agentPayResult, setAgentPayResult] = useState<AgentPayResponse | null>(null);

  // ====== Load vault info on mount ======
  useEffect(() => {
    const fetchVault = async () => {
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
        setVaultError(err.message || 'Failed to fetch vault info');
      } finally {
        setVaultLoading(false);
      }
    };

    fetchVault();
  }, []);

  // ====== Manual pay: copy details to clipboard ======
  const handleCopyManualDetails = async () => {
    if (!manualMerchant || !manualAmountAda) {
      setManualMessage('Please enter merchant address and amount first.');
      return;
    }

    const text = `Merchant address: ${manualMerchant}\nAmount: ${manualAmountAda} ADA\nWallet: ${selectedWallet}`;
    try {
      await navigator.clipboard.writeText(text);
      setManualMessage('Payment details copied. Open your wallet and send the funds manually.');
    } catch {
      setManualMessage('Could not copy to clipboard. Please copy the data manually.');
    }
  };

  // ====== Verify & Mint Receipt ======
  const handleVerifyAndMint = async () => {
    setVerifyError(null);
    setVerifyResult(null);

    if (!verifyTxHash || !verifyPayerAddress || !verifyMerchantAddress || !verifyAmountAda) {
      setVerifyError('Please fill all fields.');
      return;
    }

    const amountAdaNum = Number(verifyAmountAda);
    if (isNaN(amountAdaNum) || amountAdaNum <= 0) {
      setVerifyError('Invalid amount.');
      return;
    }

    const amountLovelace = Math.round(amountAdaNum * 1_000_000);

    try {
      setVerifyLoading(true);
      const res = await fetch(`${API_BASE}/api/mint-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_hash: verifyTxHash.trim(),
          payer_address: verifyPayerAddress.trim(),
          merchant_address: verifyMerchantAddress.trim(),
          amount_lovelace: amountLovelace,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Backend error: ${res.status}`);
      }

      const data: MintReceiptResponse = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ====== Agent pay from vault ======
  const handleAgentPay = async () => {
    setAgentPayError(null);
    setAgentPayResult(null);

    if (!agentMerchant || !agentAmountAda) {
      setAgentPayError('Please fill merchant address and amount.');
      return;
    }

    const amountAdaNum = Number(agentAmountAda);
    if (isNaN(amountAdaNum) || amountAdaNum <= 0) {
      setAgentPayError('Invalid amount.');
      return;
    }

    const amountLovelace = Math.round(amountAdaNum * 1_000_000);

    try {
      setAgentPayLoading(true);
      const res = await fetch(`${API_BASE}/api/agent/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_address: agentMerchant.trim(),
          amount_lovelace: amountLovelace,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Backend error: ${res.status}`);
      }

      const data: AgentPayResponse = await res.json();
      setAgentPayResult(data);

      // Update vault info on screen with the new balance returned by API
      setVaultInfo((prev) =>
        prev
          ? {
              ...prev,
              on_chain_lovelace: data.new_vault_balance_lovelace,
              on_chain_ada: data.new_vault_balance_ada,
            }
          : null
      );
    } catch (err: any) {
      setAgentPayError(err.message || 'Agent payment failed.');
    } finally {
      setAgentPayLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Section 1: Manual pay via wallet */}
      <section className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Step 1: Pay via Wallet</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose your wallet, enter merchant address and amount, then send the payment manually from your wallet.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Merchant address</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="addr_test1..."
              value={manualMerchant}
              onChange={(e) => setManualMerchant(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (ADA)</label>
            <input
              type="number"
              min="0"
              step="0.000001"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 5"
              value={manualAmountAda}
              onChange={(e) => setManualAmountAda(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Wallet</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
            >
              <option value="eternl">Eternl</option>
              <option value="lace">Lace</option>
              <option value="nami">Nami</option>
              <option value="flint">Flint</option>
              <option value="typhon">Typhon</option>
              <option value="gero">Gero</option>
            </select>
          </div>

          <button
            onClick={handleCopyManualDetails}
            className="md:w-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Copy payment details
          </button>
        </div>

        {manualMessage && (
          <p className="mt-3 text-sm text-gray-700">
            {manualMessage}
          </p>
        )}
      </section>

      {/* Section 2: Verify + Mint Receipt */}
      <section className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Step 2: Verify Payment & Mint Receipt</h2>
        <p className="text-sm text-gray-600 mb-4">
          After sending the transaction, paste the transaction hash from your wallet, along with your address,
          merchant address, and amount. The backend will verify the tx on-cardano preview via Blockfrost,
          then mint a receipt NFT and update reputation.
        </p>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Transaction hash</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Paste tx hash..."
              value={verifyTxHash}
              onChange={(e) => setVerifyTxHash(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your address (payer)</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="addr_test1..."
                value={verifyPayerAddress}
                onChange={(e) => setVerifyPayerAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Merchant address</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="addr_test1..."
                value={verifyMerchantAddress}
                onChange={(e) => setVerifyMerchantAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-1">Amount (ADA)</label>
            <input
              type="number"
              min="0"
              step="0.000001"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 5"
              value={verifyAmountAda}
              onChange={(e) => setVerifyAmountAda(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleVerifyAndMint}
          disabled={verifyLoading}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {verifyLoading ? 'Verifying on-chain...' : 'Verify & Mint Receipt NFT'}
        </button>

        {verifyError && (
          <p className="mt-3 text-sm text-red-600">
            {verifyError}
          </p>
        )}

        {verifyResult && (
          <div className="mt-4 border border-emerald-100 bg-emerald-50 rounded-lg p-3 text-sm">
            <p><span className="font-semibold">Verified tx:</span> {verifyResult.tx_hash}</p>
            {verifyResult.nft_asset_id && (
              <p><span className="font-semibold">Receipt NFT:</span> {verifyResult.nft_asset_id}</p>
            )}
            <p><span className="font-semibold">Updated reputation score:</span> {verifyResult.reputation_score}</p>
          </div>
        )}
      </section>

      {/* Section 3: Agent Vault (AI Agent) */}
      <section className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">AI Agent Vault Payments (Optional)</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is a shared AI agent vault on Cardano preview. Users can send tADA to this address.
          The agent can then pay merchants on their behalf and mint receipts, while also tracking
          a reputation score for the agent.
        </p>

        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Vault info</h3>
          {vaultLoading && <p className="text-sm text-gray-600">Loading vault info...</p>}
          {vaultError && <p className="text-sm text-red-600">{vaultError}</p>}
          {vaultInfo && (
            <div className="text-sm">
              <p><span className="font-medium">Agent:</span> {vaultInfo.name} (id {vaultInfo.id})</p>
              <p className="break-all">
                <span className="font-medium">Vault address:</span> {vaultInfo.vault_address}
              </p>
              <p className="mt-1">
                <span className="font-medium">Balance (displayed):</span> {vaultInfo.on_chain_ada.toFixed(6)} tADA
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold mb-2">Pay merchant from agent vault</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Merchant address</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="addr_test1..."
                value={agentMerchant}
                onChange={(e) => setAgentMerchant(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount (ADA)</label>
              <input
                type="number"
                min="0"
                step="0.000001"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 2.5"
                value={agentAmountAda}
                onChange={(e) => setAgentAmountAda(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleAgentPay}
            disabled={agentPayLoading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            {agentPayLoading ? 'Agent paying on-chain...' : 'Pay from Agent Vault'}
          </button>

          {agentPayError && (
            <p className="mt-3 text-sm text-red-600">
              {agentPayError}
            </p>
          )}

          {agentPayResult && (
            <div className="mt-4 border border-blue-100 bg-blue-50 rounded-lg p-3 text-sm">
              <p><span className="font-semibold">Agent tx hash:</span> {agentPayResult.tx_hash}</p>
              <p><span className="font-semibold">Receipt NFT:</span> {agentPayResult.receipt_nft_asset_id}</p>
              <p><span className="font-semibold">Agent reputation score:</span> {agentPayResult.reputation_score}</p>
              <p className="mt-1">
                <span className="font-semibold">Vault balance (after tx):</span>{' '}
                {agentPayResult.new_vault_balance_ada.toFixed(6)} tADA
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PayAndVerify;
