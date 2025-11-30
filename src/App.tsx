import { useState } from "react";
import Navbar from "./components/Navbar";
import FloatingChat from "./components/FloatingChat";
import Toast from "./components/Toast";
import Home from "./pages/Home";
import PayAndVerify from "./pages/PayAndVerify";
import History from "./pages/History";
import Whitepaper from "./pages/Whitepaper";
import AboutCardano from "./pages/AboutCardano";
import Agents from "./pages/Agents";

type Page = "home" | "pay" | "history" | "whitepaper" | "about" | "agents" | "agent";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "info",
  });

  const [availableWallets] = useState<string[]>([
    "eternl",
    "lace",
    "nami",
    "flint",
  ]);

  const [selectedWallet, setSelectedWallet] = useState<string>("eternl");

  const showToast = (message: string, type: ToastState["type"] = "info") => {
    setToast({ show: true, message, type });
  };

  const handleWalletConnect = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress(null);
      showToast("Wallet disconnected", "info");
    } else {
      setWalletConnected(true);
      // Mock wallet address for demo
      setWalletAddress("addr_test1qz8...example");
      showToast(`Connected: ${selectedWallet}`, "success");
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={handleNavigate} onWalletConnect={handleWalletConnect} />;
      case "pay":
        return <PayAndVerify />;
      case "history":
        return <History walletAddress={walletAddress} onShowToast={showToast} />;
      case "whitepaper":
        return <Whitepaper />;
      case "about":
        return <AboutCardano />;
      case "agents":
      case "agent":
        return <Agents />;
      default:
        return <Home onNavigate={handleNavigate} onWalletConnect={handleWalletConnect} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        walletConnected={walletConnected}
        onWalletConnect={handleWalletConnect}
        availableWallets={availableWallets}
        selectedWallet={selectedWallet}
        onSelectWallet={setSelectedWallet}
      />

      {renderPage()}
      <FloatingChat />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}