// src/components/AIDoctor.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Send, X, Bot, User,
  Minimize2, Maximize2, Brain, Sparkles, Shield
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIDoctor: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello! I'm your AI medical assistant. I can help answer general health questions and provide evidence-based medical information. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const encoded = encodeURIComponent(inputMessage);
      const apiUrl = `https://pharmago-mindbot.vercel.app/api/prompt/${encoded}`;

      console.log("Calling API:", apiUrl);
      const res = await fetch(apiUrl, { method: 'GET' });
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Status ${res.status}: ${errText}`);
      }
      const reply = await res.text();
      setMessages(prev => [
        ...prev,
        { id: (Date.now()+1).toString(), type: 'ai', content: reply, timestamp: new Date() }
      ]);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now()+1).toString(),
          type: 'ai',
          content: `⚠️ Sorry, something went wrong: ${(err as Error).message}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 group"
      >
        <div className="btn-primary p-4 rounded-full flex items-center space-x-3 shadow-strong">
          <Brain size={28} />
          <span className="hidden md:block font-bold">AI Doctor</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 ${isRTL ? 'left-8' : 'right-8'} w-96 max-w-[calc(100vw-4rem)] z-50`}>
      <div className={`card border-2 border-dark-blue ${isMinimized ? 'h-20' : 'h-[600px]'} transition-all duration-500 overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-blue to-medium-blue p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="font-bold flex items-center space-x-2">
                  <span>{t('aiDoctor')}</span>
                  <Sparkles size={16} />
                </h3>
                <p className="text-xs opacity-90">Medical Assistant Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {isMinimized ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/20 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <X size={16}/>
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type==='user' ? 'justify-end':'justify-start'} animate-slide-up`}
                >
                  <div className={`max-w-[85%] ${msg.type==='user'?'bg-dark-blue text-white':'bg-white border border-gray-200'} p-4 rounded-2xl shadow-sm`}>
                    <div className="flex items-start space-x-3">
                      {msg.type==='ai' ? <Bot size={18} className="text-dark-blue mt-1"/> : <User size={18} className="text-white/80 mt-1"/>}
                      <div className="flex-1">
                        <ReactMarkdown components={{
                          p: ({node, ...props}) => <p className={`text-sm leading-relaxed max-w-full ${msg.type==='user'?'text-white':'text-gray-800'}`} {...props} />
                        }}>
                          {msg.content}
                        </ReactMarkdown>
                        <p className={`text-xs mt-2 ${msg.type==='user'?'text-white/60':'text-gray-500'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Bot size={18} className="text-dark-blue"/>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-dark-blue rounded-full animate-bounce"/>
                        <div className="w-2 h-2 bg-dark-blue rounded-full animate-bounce" style={{ animationDelay:'0.1s' }}/>
                        <div className="w-2 h-2 bg-dark-blue rounded-full animate-bounce" style={{ animationDelay:'0.2s' }}/>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('askQuestion')}
                  className="flex-1 p-3 border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18}/>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-center space-x-2">
                <Shield size={12}/>
                <span>{t('disclaimer')}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIDoctor;
