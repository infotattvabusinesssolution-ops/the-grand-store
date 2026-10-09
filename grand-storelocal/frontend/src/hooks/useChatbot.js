import { useState, useCallback } from "react";
import api from "../api";

export default function useChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text: "Hi there! 👋 I'm your GrandStore Assistant. Ask me anything about orders, payments, shipping, products, and more!",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', { message: text });
      const data = res.data;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: data.answer,
          whatsapp: data.whatsapp || null,
          sources: Array.isArray(data.sources) ? data.sources : [],
          showSuggestions: !data.matched, // show quick questions again on no match
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: 'Something went wrong. Please try again or contact us on WhatsApp.',
          whatsapp: '+27765809522',
          showSuggestions: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, sendMessage };
}
