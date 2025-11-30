interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  walletConnected: boolean;
  onWalletConnect: () => void;
  availableWallets: string[];
  selectedWallet: string | null;
  onSelectWallet: (wallet: string) => void;
}

// Align IDs with App.tsx routes
const links: { id: string; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'pay', label: 'Pay & Verify' },
  { id: 'history', label: 'History' },
  { id: 'agent', label: 'Agents' },          // <- global agent vault page
  { id: 'whitepaper', label: 'Whitepaper' },
  { id: 'about', label: 'About Cardano' },
];

export default function Navbar({
  onNavigate,
  currentPage,
  walletConnected,
  onWalletConnect,
  availableWallets,
  selectedWallet,
  onSelectWallet,
}: NavbarProps) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight text-blue-700">
            VibeChain
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={
                  currentPage === link.id
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-blue-600'
                }
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Wallet selector */}
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 text-xs"
              value={selectedWallet ?? ''}
              onChange={(e) => onSelectWallet(e.target.value)}
            >
              {availableWallets.length === 0 ? (
                <option value="">No wallet</option>
              ) : (
                availableWallets.map((w) => (
                  <option key={w} value={w}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={onWalletConnect}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              walletConnected
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {walletConnected ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden border-t border-gray-200 bg-white">
        <div className="flex overflow-x-auto text-xs px-2 py-2 gap-3">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={
                currentPage === link.id
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600'
              }
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
