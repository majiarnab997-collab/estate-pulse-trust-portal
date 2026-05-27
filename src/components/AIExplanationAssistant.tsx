/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, MessageSquare, CornerDownRight, RefreshCw, X, HelpCircle } from 'lucide-react';

interface AIExplanationAssistantProps {
  token: string | null;
  onSendAlert: (title: string, msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Message {
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

export default function AIExplanationAssistant({ token, onSendAlert }: AIExplanationAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'AI',
      text: "Hello! I am your **Elite Homes Compliance TrustBot**. I am server-synchronized with your property plot coordinates, file validation status history, and payment schedule milestones.\n\nAsk me anything! For example: \n* *\"What is the status of my Soil Report file?\"*\n* *\"Why is my Property Registration under review?\"*\n* *\"How much is my outstanding balance count?\"*\n* *\"Explain what a Geotechnical Soil report certifies.\"*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    
    // Add user message to UI
    const newUserMessage: Message = {
      sender: 'USER',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          previousChatHistory: messages.slice(-6), // Send last few messages for continuity
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Server processing error');
      }

      const aiMessage: Message = {
        sender: 'AI',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      onSendAlert('AI Support Offline', err.message || 'Unable to stream Gemini advice at this time.', 'error');
      
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: `⚠️ **API Key Configuration Required**\n\nI was unable to consult the Gemini models. Please make sure that you've supplied your genuine **GEMINI_API_KEY** in the top-right **Settings > Secrets** panel of the AI Studio workspace.\n\nOnce added, the server will immediately unlock smart interactive documentation and policy consulting!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const insertQuickQuery = (query: string) => {
    setInput(query);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* AI Panel Header */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              Gemini Virtual Trust Consultant
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                <Sparkles className="w-2.5 h-2.5" /> LIVE CONTEXT
              </span>
            </h3>
            <p className="text-xs text-slate-400">Grounded with your property blueprint, payments & files</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>gemini-3.5-flash</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'AI' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 self-start">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            
            <div className={`max-w-[85%] rounded-2xl p-3.5 border text-sm leading-relaxed ${
              msg.sender === 'USER' 
                ? 'bg-indigo-600/25 border-indigo-500/30 text-white rounded-tr-none' 
                : 'bg-slate-900/90 border-slate-800 text-slate-300 rounded-tl-none font-sans'
            }`}>
              {/* Simple Markdown Processing for text styling */}
              <div className="space-y-2 whitespace-pre-wrap">
                {msg.text.split('\n').map((line, idx) => {
                  let formattedLine = line;
                  // Handle bullet lists
                  if (line.trim().startsWith('*')) {
                    formattedLine = '• ' + line.trim().substring(1).trim();
                  }

                  // Super simple inline markdown renderer for bold/italic highlights
                  // Replace: **text** with <strong>text</strong>
                  const parts = formattedLine.split('**');
                  return (
                    <p key={idx}>
                      {parts.map((part, pIdx) => {
                        if (pIdx % 2 === 1) {
                          // Bold part
                          // Handle sub-italics *text* within bold
                          const subParts = part.split('*');
                          return (
                            <strong key={pIdx} className="text-slate-100 font-semibold bg-slate-950/40 px-1 py-0.5 rounded border border-slate-800">
                              {subParts.map((sp, spIdx) => spIdx % 2 === 1 ? <em key={spIdx} className="text-indigo-300">{sp}</em> : sp)}
                            </strong>
                          );
                        } else {
                          // Normal part
                          const subParts = part.split('*');
                          return subParts.map((sp, spIdx) => spIdx % 2 === 1 ? <em key={spIdx} className="text-indigo-400 font-medium">{sp}</em> : sp);
                        }
                      })}
                    </p>
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-500 block text-right mt-1.5 font-mono">{msg.timestamp}</span>
            </div>

            {msg.sender === 'USER' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 self-start text-xs font-semibold">
                ME
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo text-indigo-400 shrink-0 self-start animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl rounded-tl-none p-4 text-sm text-indigo-200 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span className="text-xs text-slate-400">Consulting land logs & rules guidelines...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Queries */}
      <div className="p-2 bg-slate-950/80 border-t border-slate-800/60 flex gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => insertQuickQuery("Explain what a Soil Report certifies.")}
          className="text-[11px] bg-slate-900 hover:bg-slate-850 hover:text-indigo-300 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition"
        >
          🔍 Soil Geotechnical Explainer
        </button>
        <button
          onClick={() => insertQuickQuery("What status are my property documents on currently?")}
          className="text-[11px] bg-slate-900 hover:bg-slate-850 hover:text-indigo-300 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition"
        >
          📄 My Documents Review Status
        </button>
        <button
          onClick={() => insertQuickQuery("How much remaining balance do I owe is on Plot #452?")}
          className="text-[11px] bg-slate-900 hover:bg-slate-850 hover:text-indigo-300 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition"
        >
          💰 Payment installment milestones
        </button>
        <button
          onClick={() => insertQuickQuery("Why does official registration need sub-registrar reviews?")}
          className="text-[11px] bg-slate-900 hover:bg-slate-850 hover:text-indigo-300 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition"
        >
          ⚖️ Registration Legal Rules
        </button>
      </div>

      {/* Input Message box Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? "Generating response..." : "Ask Elite Homes TrustBot a query..."}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/10"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
