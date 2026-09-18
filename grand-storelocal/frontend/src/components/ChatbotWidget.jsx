import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ExternalLink } from 'lucide-react';
import useChatbot from '../hooks/useChatbot';

const renderMessageText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Also handle line breaks if they exist
    return <span key={i}>{part.split('\n').map((line, j) => <React.Fragment key={j}>{j > 0 && <br />}{line}</React.Fragment>)}</span>;
  });
};

const QUICK_QUESTIONS = [
  'How do I track my order?',
  'What payment methods do you accept?',
  'How long does delivery take?',
  'What is your return policy?',
  'How do I become a vendor?',
  'How do auctions work?',
  'How do I place an order?',
  'Can I cancel my order?',
  'How do I get my invoice?',
  'Can I modify my order after placing it?',
  'What is PayFast and how does it work?',
  'My payment failed. What should I do?',
  'How do refunds work?',
  'Where do you deliver?',
  'Can I collect my order at a Postnet branch?',
  'Do you offer free shipping?',
  'I received a damaged item. What do I do?',
  'I received the wrong item. What should I do?',
  'A product I want is out of stock. When will it be available?',
  'Do you sell alcohol?',
  'Are your products genuine and authentic?',
  'Can I leave a review for a product?',
  'Can I compare products?',
  'How do I add items to my wishlist?',
  'How do I create an account?',
  'I forgot my password. How do I reset it?',
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useChatbot();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-open once per browser session (not on every refresh)
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('chatbot_teaser_shown');
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        setShowTeaser(true);
        sessionStorage.setItem('chatbot_teaser_shown', 'true');
      }, 5000); // show teaser bubble after 5 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setShowTeaser(false);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuick = (q) => {
    sendMessage(q);
  };

  return (
    <>
      {/* Teaser Bubble — shown once per session, 5s after page load */}
      {showTeaser && !open && (
        <div
          onClick={handleOpen}
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '20px',
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(201,163,91,0.35)',
            borderRadius: '16px 16px 16px 4px',
            padding: '12px 16px',
            maxWidth: '230px',
            cursor: 'pointer',
            zIndex: 9997,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            animation: 'teaserSlide 0.45s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div style={{ fontSize: '13px', color: '#f5ede0', lineHeight: '1.5', paddingRight: '16px' }}>
            👋 Hi! Need help with orders, payments, or anything else?
          </div>
          <div style={{ fontSize: '11px', color: '#c9a35b', marginTop: '6px', fontWeight: 600 }}>
            Click to chat →
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: open ? '90px' : '-600px',
          left: '20px',
          width: '360px',
          maxWidth: 'calc(100vw - 40px)',
          height: '520px',
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(201,163,91,0.25)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(201,163,91,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          overflow: 'hidden',
          transition: 'bottom 0.4s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
        }}
      >

        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1400 0%, #0a0a0a 100%)',
            borderBottom: '1px solid rgba(201,163,91,0.15)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Bot Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c9a35b, #8b6914)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '18px',
            }}
          >
            🍷
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f5ede0', fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em' }}>
              GrandStore Assistant
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ color: '#22c55e', fontSize: '11px', letterSpacing: '0.08em' }}>Online</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#888',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.target.style.color = '#888'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(201,163,91,0.2) transparent',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '8px',
              }}
            >
              {msg.from === 'bot' && (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c9a35b, #8b6914)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  🍷
                </div>
              )}
              <div style={{ maxWidth: '80%' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: msg.from === 'user' ? '#c9a35b' : '#1a1a1a',
                    color: msg.from === 'user' ? '#000' : '#f5ede0',
                    fontSize: '13px',
                     lineHeight: '1.55',
                     whiteSpace: 'pre-line',
                     border: msg.from === 'bot' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    fontWeight: msg.from === 'user' ? 500 : 400,
                  }}
                >
                  {renderMessageText(msg.text)}
                </div>
                {/* WhatsApp CTA */}
                {msg.whatsapp && (
                  <a
                    href={`https://wa.me/${msg.whatsapp.replace(/\D/g, '')}?text=Hi, I need help with my question.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      padding: '8px 14px',
                      backgroundColor: '#25D366',
                      color: '#fff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      letterSpacing: '0.03em',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    💬 Chat on WhatsApp
                    <ExternalLink size={12} />
                  </a>
                )}

                {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {msg.sources.slice(0, 4).map((source) => (
                      <a
                        key={`${source.url}-${source.label}`}
                        href={source.url}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 9px',
                          backgroundColor: 'rgba(201,163,91,0.08)',
                          border: '1px solid rgba(201,163,91,0.22)',
                          borderRadius: '12px',
                          color: '#c9a35b',
                          fontSize: '10px',
                          lineHeight: 1.2,
                          textDecoration: 'none',
                        }}
                      >
                        {source.label}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Suggestion chips after no-match */}
                {msg.showSuggestions && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ color: '#666', fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Try one of these:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(showAllQuestions ? QUICK_QUESTIONS : QUICK_QUESTIONS.slice(0, 6)).map((q) => (
                        <button
                          key={q}
                          onClick={() => handleQuick(q)}
                          style={{
                            padding: '5px 11px',
                            backgroundColor: 'rgba(201,163,91,0.08)',
                            border: '1px solid rgba(201,163,91,0.25)',
                            borderRadius: '20px',
                            color: '#c9a35b',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            letterSpacing: '0.02em',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,163,91,0.18)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,163,91,0.08)'; }}
                        >
                          {q}
                        </button>
                      ))}
                      {QUICK_QUESTIONS.length > 6 && (
                        <button
                          onClick={() => setShowAllQuestions(!showAllQuestions)}
                          style={{
                            padding: '5px 11px',
                            backgroundColor: 'transparent',
                            border: '1px dashed rgba(201,163,91,0.5)',
                            borderRadius: '20px',
                            color: '#c9a35b',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            letterSpacing: '0.02em',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,163,91,0.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {showAllQuestions ? 'Show Less' : `+${QUICK_QUESTIONS.length - 6} More`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c9a35b, #8b6914)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                }}
              >
                🍷
              </div>
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '10px 16px',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#c9a35b',
                      animation: `chatBounce 1.2s ease infinite ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Questions (only shown at start) */}
          {messages.length === 1 && !loading && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ color: '#666', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Popular questions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(showAllQuestions ? QUICK_QUESTIONS : QUICK_QUESTIONS.slice(0, 6)).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuick(q)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'rgba(201,163,91,0.08)',
                      border: '1px solid rgba(201,163,91,0.2)',
                      borderRadius: '20px',
                      color: '#c9a35b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      letterSpacing: '0.02em',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,163,91,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,163,91,0.08)'; }}
                  >
                    {q}
                  </button>
                ))}
                {QUICK_QUESTIONS.length > 6 && (
                  <button
                    onClick={() => setShowAllQuestions(!showAllQuestions)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px dashed rgba(201,163,91,0.5)',
                      borderRadius: '20px',
                      color: '#c9a35b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      letterSpacing: '0.02em',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,163,91,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {showAllQuestions ? 'Show Less' : `+${QUICK_QUESTIONS.length - 6} More`}
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            backgroundColor: '#0d0d0d',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your question..."
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(201,163,91,0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#f5ede0',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(201,163,91,0.5)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(201,163,91,0.2)'; }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #c9a35b, #8b6914)',
              border: 'none',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !loading ? 1 : 0.5,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>

        {/* Branding Footer */}
        <div style={{ textAlign: 'center', padding: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', backgroundColor: '#0d0d0d' }}>
          <span style={{ color: '#444', fontSize: '10px', letterSpacing: '0.08em' }}>
            Powered by The Grand Store
          </span>
        </div>
      </div>

      {/* Floating Bubble Button */}
      <button
        onClick={() => open ? setOpen(false) : handleOpen()}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c9a35b, #8b6914)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(201,163,91,0.4), 0 0 0 0 rgba(201,163,91,0.3)',
          animation: open ? 'none' : 'chatPulse 2.5s ease-in-out infinite',
          transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
          transform: open ? 'scale(0.9) rotate(90deg)' : 'scale(1)',
        }}
        title="Chat with us"
        aria-label="Open chat assistant"
      >
        {open ? <X size={24} color="#000" /> : <MessageCircle size={24} color="#000" />}
      </button>

      {/* Global Keyframe Styles */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(201,163,91,0.4), 0 0 0 0 rgba(201,163,91,0.3); }
          50% { box-shadow: 0 8px 32px rgba(201,163,91,0.5), 0 0 0 12px rgba(201,163,91,0); }
        }
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes teaserSlide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
