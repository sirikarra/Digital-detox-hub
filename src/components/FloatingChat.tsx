import { useState } from 'react';

interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  ts: string;
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: 'bot',
      text: 'Hi, I am VibeChain support. Ask me about payments, reputation, or wallets.',
      ts: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const getBotReply = (text: string): string => {
    const q = text.toLowerCase();

    if (q.includes('reputation') || q.includes('score')) {
      return 'Reputation score is based on past successful payments recorded for that address. Higher score = more trusted. Use the Verify Reputation button next to the merchant address.';
    }
    if (q.includes('wallet') || q.includes('eternl') || q.includes('nami')) {
      return 'We support multiple Cardano wallets via CIP-30. Eternl may not allow programmatic sends from dApps, so for Eternl you might need to send ADA manually and paste the tx hash.';
    }
    if (q.includes('pay') || q.includes('payment') || q.includes('hash')) {
      return 'To pay, send ADA from your wallet to the merchant address. Then copy the transaction hash from your wallet history into the Verify form so we can confirm it on-chain.';
    }
    if (q.includes('history')) {
      return 'The History page shows your past receipts recorded by VibeChain based on your identity address.';
    }
    return 'Got it. For this hackathon demo the chat is local-only, but I can still guide you: ask about payments, reputation, wallets, or history.';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const ts = new Date().toLocaleTimeString();

    pushMessage({ from: 'user', text: trimmed, ts });
    setInput('');

    const reply = getBotReply(trimmed);
    pushMessage({ from: 'bot', text: reply, ts: new Date().toLocaleTimeString() });
  };

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {open && (
        <div className="mb-3 w-80 h-96 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-blue-600 text-white text-sm">
            <span>Support Chat</span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs hover:opacity-80"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 px-3 py-2 overflow-y-auto bg-gray-50 text-xs space-y-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.from === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-2 py-1 ${
                    m.from === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <div>{m.text}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 text-right">
                    {m.ts}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={handleSend}
            className="border-t border-gray-200 flex items-center gap-2 px-2 py-1 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-xs border rounded px-2 py-1"
              placeholder="Type your question…"
            />
            <button
              type="submit"
              className="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center text-xl hover:bg-blue-700"
        aria-label="Open support chat"
      >
        💬
      </button>
    </div>
  );
}
