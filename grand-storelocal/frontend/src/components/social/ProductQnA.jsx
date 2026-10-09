import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export const ProductQnA = ({ questions, productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localQuestions, setLocalQuestions] = useState(Array.isArray(questions) ? questions : []);
  const [expanded, setExpanded] = useState({});
  const [newQuestion, setNewQuestion] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [replyingTo, setReplyingTo] = useState('');

  useEffect(() => {
    if (questions && Array.isArray(questions)) {
      setLocalQuestions(questions);
    }
  }, [questions, productId]);

  useEffect(() => {
    let cancelled = false;
    const fetchQuestions = async () => {
      if (!productId) return;
      setFetching(true);
      try {
        const res = await api.get(`/social-proof/questions/${productId}`);
        if (!cancelled && res.data.success) {
          setLocalQuestions(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch QnA:", error);
        if (!cancelled) setErrorMsg(error.response?.data?.message || 'Unable to load questions right now.');
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !productId) return;
    if (!user) {
      navigate('/login?redirect=' + window.location.pathname);
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/social-proof/questions', {
        productId,
        question: newQuestion.trim()
      });
      
      if (res.data.success) {
        setLocalQuestions(prev => [res.data.data, ...prev]);
        setExpanded(prev => ({ ...prev, [res.data.data._id]: true }));
        setNewQuestion('');
        setSuccessMsg("Your question has been posted.");
      }
    } catch (error) {
      console.error("Failed to post question:", error);
      setErrorMsg(error.response?.data?.message || error.response?.data?.error || "Unable to post your question.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e, qId) => {
    e.preventDefault();
    const replyText = replyTexts[qId];
    if (!replyText || !replyText.trim()) return;
    if (!user) {
      navigate('/login?redirect=' + window.location.pathname);
      return;
    }
    
    setErrorMsg('');
    setSuccessMsg('');
    setReplyingTo(qId);
    try {
      const res = await api.post(`/social-proof/questions/${qId}/answers`, {
        text: replyText.trim()
      });
      
      if (res.data.success) {
        setLocalQuestions(prev => prev.map(q => q._id === qId ? res.data.data : q));
        setReplyTexts(prev => ({ ...prev, [qId]: '' }));
        setSuccessMsg("Your answer has been posted.");
      }
    } catch (error) {
      console.error("Failed to post answer:", error);
      setErrorMsg(error.response?.data?.message || error.response?.data?.error || "Unable to post your answer.");
    } finally {
      setReplyingTo('');
    }
  };

  const getBadgeClass = (type) => {
    switch(type) {
      case 'expert': return 'bg-gold-500 text-black px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2 tracking-wider';
      case 'vendor': return 'bg-[#333] text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2 tracking-wider';
      case 'customer': return 'bg-white/10 text-[var(--color-ivory)] px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2 tracking-wider';
      default: return 'bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2';
    }
  };

  return (
    <div className="product-qna">
      <h3 className="mb-6 flex items-start gap-3 font-serif text-xl sm:items-center sm:text-2xl">
        <MessageCircle className="mt-0.5 shrink-0 text-gold-500 sm:mt-0" />
        Questions from Customers
      </h3>

      <div className="relative mb-8 rounded-sm border border-white/10 bg-white/5 p-4 sm:p-6">
        <h4 className="text-sm uppercase tracking-widest mb-4">Have a question about this product?</h4>
        <form onSubmit={handleAsk} className="flex min-w-0 flex-col gap-4 sm:flex-row">
          <input 
            type="text" 
            className="min-w-0 flex-1 border-b border-white/20 bg-transparent pb-2 outline-none transition-colors focus:border-gold-500"
            placeholder="e.g. Is this wine sweet?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <button type="submit" disabled={loading} className="button button-gold w-full px-6 py-2 text-sm disabled:opacity-50 sm:w-auto">Ask</button>
        </form>
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 text-xs tracking-wider text-green-400" role="status">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-xs tracking-wider text-red-400" role="alert">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            {errorMsg}
          </div>
        )}
      </div>

      {fetching ? (
        <p className="text-[var(--color-ivory-muted)] italic">Loading questions...</p>
      ) : localQuestions.length === 0 ? (
        <p className="text-[var(--color-ivory-muted)] italic">No questions have been asked yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {localQuestions.map((q) => (
            <div key={q._id} className="border-b border-white/10 pb-4">
              <button 
                className="group flex w-full min-w-0 items-start justify-between gap-3 py-2 text-left sm:items-center"
                onClick={() => toggleExpand(q._id)}
              >
                <span className="min-w-0 break-words font-medium transition-colors group-hover:text-gold-400">Q: {q.question}</span>
                <span className="mt-0.5 shrink-0 sm:mt-0">{expanded[q._id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
              </button>
              
              {expanded[q._id] && q.answers && q.answers.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gold-500/30 space-y-4 mb-4">
                  {q.answers.map((a, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-[var(--color-ivory)] mb-1">
                        <span className="font-bold text-gold-400">A: </span> 
                        {a.text}
                      </p>
                      <p className="text-xs text-[var(--color-ivory-muted)] italic flex items-center">
                        Answered by {a.responder?.name || 'Grand Store User'} 
                        <span className={getBadgeClass(a.responderType)}>{a.responderType}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {expanded[q._id] && (!q.answers || q.answers.length === 0) && (
                <div className="mt-3 pl-4 border-l-2 border-gold-500/30 mb-4">
                  <p className="text-sm text-[var(--color-ivory-muted)] italic">Awaiting answer...</p>
                </div>
              )}
              
              {expanded[q._id] && (
                <form onSubmit={(e) => handleReply(e, q._id)} className="mt-4 flex min-w-0 flex-col gap-2 pl-4 sm:flex-row">
                  <input 
                    type="text" 
                    className="min-w-0 flex-1 border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-gold-500"
                    placeholder="Know the answer? Reply here..."
                    value={replyTexts[q._id] || ''}
                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [q._id]: e.target.value }))}
                  />
                  <button type="submit" disabled={replyingTo === q._id} className="button button-gold w-full px-4 py-2 text-sm disabled:opacity-50 sm:w-auto">
                    {replyingTo === q._id ? 'Posting...' : 'Reply'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductQnA;
