'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const copyToClipboard = async (text, index) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex((current) => (current === index ? null : current));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const startNewChat = () => {
    if (isLoading) return;
    setMessages([]);
    setInput('');
    setError(null);
    setCopiedIndex(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);

    const userMessage = { role: 'user', content: trimmedInput };
    const updatedMessages = [...messages, userMessage];

    // Optimistically update conversation history
    setMessages(updatedMessages);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('Streaming is not supported by your browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let hasStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          assistantText += chunk;
          hasStarted = true;
          setMessages([
            ...updatedMessages,
            { role: 'assistant', content: assistantText },
          ]);
        }
      }

      if (!hasStarted && !assistantText) {
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: 'No response generated.' },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-expand textarea up to max height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div className="chat-wrapper">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          height: 100vh;
        }

        .chat-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100%;
        }

        .chat-container {
          width: 100%;
          max-width: 720px;
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        @media (min-width: 768px) {
          .chat-container {
            height: 90vh;
            max-height: 850px;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
        }

        .chat-header {
          padding: 14px 20px;
          border-bottom: 1px solid #e2e8f0;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: #0f172a;
        }

        .chat-status {
          font-size: 0.8rem;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10b981;
        }

        .new-chat-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #f8fafc;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .new-chat-button:hover:not(:disabled) {
          background-color: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .new-chat-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          text-align: center;
          font-size: 0.95rem;
        }

        .message-row {
          display: flex;
          width: 100%;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 82%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 0.95rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-row.user .message-bubble {
          background-color: #2563eb;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .message-row.assistant .message-bubble {
          background-color: #f1f5f9;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .assistant-bubble-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 82%;
          gap: 4px;
        }

        .assistant-bubble-container .message-bubble {
          max-width: 100%;
        }

        .copy-button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 3px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-left: 2px;
        }

        .copy-button:hover {
          color: #0f172a;
          background-color: #e2e8f0;
        }

        .copy-button.copied {
          color: #059669;
        }

        .loading-bubble {
          background-color: #f1f5f9;
          color: #64748b;
          border-bottom-left-radius: 4px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #94a3b8;
          border-radius: 50%;
          animation: pulse 1.2s infinite ease-in-out both;
        }

        .pulse-dot:nth-child(1) { animation-delay: -0.32s; }
        .pulse-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .error-banner {
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
          color: #b91c1c;
          padding: 10px 14px;
          font-size: 0.88rem;
          margin: 0 20px 12px 20px;
          border-radius: 6px;
        }

        .input-area {
          padding: 14px 20px;
          border-top: 1px solid #e2e8f0;
          background-color: #ffffff;
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .chat-textarea {
          flex: 1;
          min-height: 42px;
          max-height: 140px;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          line-height: 1.4;
          resize: none;
          outline: none;
          background-color: #f8fafc;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .chat-textarea:focus {
          border-color: #2563eb;
          background-color: #ffffff;
        }

        .send-button {
          height: 42px;
          padding: 0 18px;
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s, opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-button:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <main className="chat-container">
        <header className="chat-header">
          <div className="header-left">
            <h1 className="chat-title">AI Chatbot</h1>
            <div className="chat-status">
              <span className="chat-status-dot"></span>
              Online
            </div>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isLoading || messages.length === 0}
            className="new-chat-button"
            title="Start a new chat"
            aria-label="Start a new chat"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </header>

        <section className="messages-area" aria-label="Conversation messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>Type a message below to start chatting with Gemini AI.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <div className="assistant-bubble-container">
                    <div className="message-bubble">{msg.content}</div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.content, index)}
                      className={`copy-button ${copiedIndex === index ? 'copied' : ''}`}
                      title="Copy response to clipboard"
                      aria-label="Copy AI response"
                    >
                      {copiedIndex === index ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="message-bubble">{msg.content}</div>
                )}
              </div>
            ))
          )}

          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="message-row assistant">
              <div className="message-bubble loading-bubble">
                <span className="pulse-dot"></span>
                <span className="pulse-dot"></span>
                <span className="pulse-dot"></span>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <footer className="input-area">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift + Enter for new line)"
            className="chat-textarea"
            disabled={isLoading}
            aria-label="Message input"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="send-button"
            type="button"
          >
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}
