import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Shield, Clock, AlertCircle, ChevronDown, CircleDot } from 'lucide-react';
import axios from 'axios';
import socketService from '../services/socketService'; // ✅ Using your existing service

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ChatWidget({ user }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const assignedCaseManagerId = user?.assignedCaseManager?._id || user?.assignedCaseManager;
 
  const getToken = () => localStorage.getItem('token');

  // --- Debug logs ---
  useEffect(() => {
    console.log('ChatWidget initialized', { user });
  }, [user]);

  // ✅ Connect to socket and set up listeners
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    // Connect socket
    socketService.connect(userId);

    // ✅ Listen for new messages
    const handleNewMessage = ({ message }) => {
      setMessages(prev => [...prev, message]);
      
      // Update unread count if chat is closed or minimized
      if (!isChatOpen || isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
    };

    // ✅ Listen for typing indicator
    const handleTyping = ({ isTyping: typing }) => {
      setIsTyping(typing);
    };

    // ✅ Listen for unread count updates
    const handleUnreadCountUpdate = ({ unreadCount: count }) => {
      console.log('📬 Socket: Unread count updated to', count);
      setUnreadCount(count);
    };

    // Register listeners
    socketService.on('newMessage', handleNewMessage);
    socketService.on('userTyping', handleTyping);
    socketService.on('unreadCountUpdated', handleUnreadCountUpdate);

    // Cleanup
    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userTyping', handleTyping);
      socketService.off('unreadCountUpdated', handleUnreadCountUpdate);
    };
  }, [user?._id, user?.id, isChatOpen, isMinimized]);

  // ✅ Fetch unread count on mount and periodically
  useEffect(() => {
    if (!user?._id || !user?.assignedCaseManager) return;

    fetchUnreadCount();

    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      if (!isChatOpen) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?._id, user?.assignedCaseManager, isChatOpen]);

  // ✅ Fetch unread count function
  const fetchUnreadCount = async () => {
    if (!user?.assignedCaseManager) return;
    
    try {
      const res = await axios.get(`${API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
        console.log('📬 Unread count updated:', res.data.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to fetch unread count', err?.response?.data || err.message);
    }
  };

  // Fetch messages when chat opened
  useEffect(() => {
    if (isChatOpen && user?.assignedCaseManager) {
      fetchMessages();
      // ✅ Reset unread count when opening chat
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen, isMinimized, user?.assignedCaseManager]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- API calls ---
  const fetchMessages = async () => {
    if (noCaseManager) {
      console.log('❌ No case manager assigned');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/messages/conversation`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (res.data?.success) {
        setMessages(res.data.messages || []);
        markAsRead();
        // ✅ Fetch updated unread count after marking as read
        fetchUnreadCount();
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn('Failed to fetch messages', err?.response?.data || err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (noCaseManager) {
      alert('You need a case manager assigned to send messages.');
      return;
    }

    const text = newMessage;
    setNewMessage('');

    try {
      const res = await axios.post(
        `${API_URL}/messages/send`,
        { receiverId: assignedCaseManagerId, text },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (err) {
      console.error('Send failed', err);
      setNewMessage(text);
      alert('Failed to send message. Please try again.');
    }
  };

  const markAsRead = async () => {
    const userId = user?._id || user?.id;
    if (!userId || !user?.assignedCaseManager) return;

    try {
      const conversationId = [userId, user.assignedCaseManager].sort().join('_');
      await axios.put(
        `${API_URL}/messages/read`,
        { conversationId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    } catch (err) {
      console.warn('Mark as read failed', err);
    }
  };

  // Typing indicator emit
  const emitTyping = (typing) => {
    const userId = user?._id || user?.id;
    if (!user?.assignedCaseManager || !userId) return;

    socketService.emit('typing', {
      conversationId: [userId, user.assignedCaseManager].sort().join('_'),
      userId: userId,
      isTyping: typing
    });
  };

  const handleTyping = () => {
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (!user) return null;

  const noCaseManager = !user.assignedCaseManager;

  // --- UI ---
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating button */}
      {!isChatOpen && (
        <button
          aria-label="Open support chat"
          onClick={() => { setIsChatOpen(true); setIsMinimized(false); }}
          className="group relative bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full p-4 shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-transform transform hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />

          {/* ✅ Badge with unread count */}
          {noCaseManager ? (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center">!</span>
          ) : (
            unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-6 min-w-[24px] px-1.5 flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )
          )}
        </button>
      )}

      {/* Chat panel */}
      {isChatOpen && (
        <div className="w-[92vw] max-w-sm md:max-w-md lg:max-w-lg h-[84vh] md:h-[72vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold">Case Manager Chat</h3>
                  {!noCaseManager && (
                    <span className="flex items-center text-xs bg-white/10 px-2 py-0.5 rounded-full">Support</span>
                  )}
                </div>
                <p className="text-[11px] opacity-90 mt-0.5">{noCaseManager ? 'Setup required' : 'Secure & confidential'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                aria-label={isMinimized ? 'Restore' : 'Minimize'}
                onClick={() => setIsMinimized(v => !v)}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>

              <button
                aria-label="Close chat"
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MINIMIZED PREVIEW */}
          {isMinimized ? (
            <div className="p-4 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Conversation preview</p>
                  <p className="text-xs text-gray-500">Tap to expand and continue</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* ✅ Show unread count in minimized state */}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-6 min-w-[24px] px-2 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
                <button onClick={() => { setIsMinimized(false); inputRef.current?.focus(); }} className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm">Open</button>
              </div>
            </div>
          ) : (
            /* CHAT CONTENT */
            <>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-white to-slate-50">
                {noCaseManager && (
                  <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800">No Case Manager Assigned</h4>
                        <p className="text-xs text-yellow-700 mt-1">You need a case manager to begin the secure chat.</p>
                        <div className="mt-2 text-xs text-yellow-700 font-mono bg-yellow-100 p-2 rounded">User ID: {user._id || user.id || 'undefined'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {!noCaseManager && (
                  <div className="space-y-4">
                    {loading && (
                      <div className="text-center text-gray-500 py-6">Loading messages...</div>
                    )}

                    {!loading && messages.length === 0 && (
                      <div className="text-center text-gray-500 py-6">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Say hi to your case manager — your messages are private.</p>
                      </div>
                    )}

                    {messages.map((m) => (
                      <div key={m._id} className={`flex ${m.isFromCaseManager ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[82%] px-4 py-2 rounded-xl break-words ${m.isFromCaseManager ? 'bg-white border border-gray-100 text-gray-800 shadow-sm' : 'bg-blue-600 text-white'}`}>
                          {m.isFromCaseManager && (
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">Case Manager</span>
                            </div>
                          )}
                          <div className="text-sm leading-relaxed">{m.text}</div>
                          <div className={`flex items-center text-[11px] mt-2 ${m.isFromCaseManager ? 'justify-start' : 'justify-end'} opacity-60`}> 
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatTime(m.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Case Manager</span>
                          </div>
                          <div className="flex gap-1 items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* INPUT AREA */}
              <div className="px-4 md:px-6 py-3 bg-white border-t">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex items-end gap-3"
                >
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder={noCaseManager ? 'Case manager required to send messages...' : 'Type a message — press Enter to send'}
                    disabled={noCaseManager}
                    aria-label="Message input"
                    rows={1}
                    className="flex-1 min-h-[44px] max-h-40 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent disabled:bg-gray-100"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!noCaseManager) {
                          setNewMessage(prev => (prev ? prev + "\n" : '') + 'Hello, I need assistance with...');
                          inputRef.current?.focus();
                        }
                      }}
                      className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Template
                    </button>

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || noCaseManager}
                      className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <div>{noCaseManager ? 'Contact admin to assign case manager' : 'Messages are private and encrypted'}</div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Blue: You</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white border" /> White: Case Manager</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile backdrop */}
      {isChatOpen && (
        <div className="md:hidden fixed inset-0 bg-black/30 -z-10" onClick={() => setIsChatOpen(false)} />
      )}
    </div>
  );
}