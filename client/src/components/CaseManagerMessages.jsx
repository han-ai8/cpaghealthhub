import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Clock, User, X, Menu } from 'lucide-react';
import api from '../utils/api';
import socketService from '../services/socketService'; 
import { useUserProfile } from '../hooks/useUserProfile';

const CaseManagerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0); // ✅ Total unread count

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user: caseManager, loading: profileLoading, error: profileError } = useUserProfile();

  const getToken = () => localStorage.getItem('token');

  // ✅ Connect to socket and set up listeners
  useEffect(() => {
    if (!caseManager?._id) return;

    // Connect socket
    socketService.connect(caseManager._id);

    // ✅ Listen for new messages
    const handleNewMessage = ({ message }) => {
      // Refresh conversations list and append message if belongs to selected conversation
      fetchConversations();
      fetchTotalUnreadCount();
      
      if (selectedConversation?.userId?._id === message.senderId) {
        setMessages((prev) => [...prev, message]);
        markAsRead();
      }
    };

    // ✅ Listen for typing indicator
    const handleTyping = ({ isTyping: typing }) => {
      setIsTyping(typing);
    };

    // ✅ Listen for unread count updates
    const handleUnreadCountUpdate = ({ unreadCount }) => {
      console.log('📬 Socket: Unread count updated to', unreadCount);
      setTotalUnreadCount(unreadCount);
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
  }, [caseManager?._id, selectedConversation?._id]);

  // ✅ Fetch total unread count
  const fetchTotalUnreadCount = async () => {
    try {
      const data = await api.get('/messages/unread-count');
      
      if (data?.success) {
        setTotalUnreadCount(data.unreadCount || 0);
        console.log('📬 Total unread count:', data.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to fetch total unread count', err?.message || err);
    }
  };

  // ✅ Fetch unread count on mount and periodically
  useEffect(() => {
    if (!caseManager?._id) return;

    fetchTotalUnreadCount();

    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      fetchTotalUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [caseManager?._id]);

  useEffect(() => {
    if (caseManager?._id && !profileLoading) fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseManager?._id, profileLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

const fetchConversations = async () => {
  try {
    console.log('🔍 Fetching conversations...');
    const data = await api.get('/messages/conversations');
    
    console.log('✅ Conversations response:', data);
    
    if (data?.success) {
      setConversations(data.conversations || []);
      
      const total = (data.conversations || []).reduce((sum, conv) => {
        return sum + (conv.unreadCount?.caseManager || 0);
      }, 0);
      setTotalUnreadCount(total);
      
      console.log('✅ Conversations loaded:', data.conversations?.length);
    } else {
      console.warn('⚠️ Unexpected response format:', data);
      setConversations([]);
    }
  } catch (err) {
    console.error('❌ Error fetching conversations:', err);
    console.error('❌ Error status:', err?.status);
    console.error('❌ Error data:', err?.data); // ✅ Now you'll see server error details
    
    // Show error to user if it's a specific issue
    if (err?.status === 403) {
      console.error('Access denied - not a case manager');
    } else if (err?.status === 500) {
      console.error('Server error:', err?.data?.error || err?.message);
    }
    
    setConversations([]);
  }
};


  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      const data = await api.get(`/messages/conversation?userId=${userId}`);
      
      if (data?.success) {
        setMessages(data.messages || []);
        markAsRead();
        fetchTotalUnreadCount();
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages', err?.message || err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const data = await api.post('/messages/send', {
        receiverId: selectedConversation.userId._id,
        text
      });

      if (data?.success) {
        setMessages((prev) => [...prev, data.message]);
        fetchConversations();
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      console.error('Send message error', err?.message || err);
      setNewMessage(text);
      alert('Message failed to send. Please try again.');
    }
  };

  const markAsRead = async () => {
    if (!selectedConversation || !caseManager?._id) return;
    try {
      const conversationId = [caseManager._id, selectedConversation.userId._id].sort().join('_');
      await api.put('/messages/read', { conversationId });
      
      fetchConversations();
      fetchTotalUnreadCount();
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

const selectConversation = (conv) => {
  setSelectedConversation(conv);
  if (window.innerWidth < 768) setSidebarOpen(false);
  setMessages([]);
  
  // ✅ Only fetch messages if conversation exists (not a new placeholder)
  if (conv._id && !conv.isNew) {
    fetchMessages(conv.userId._id);
  } else {
    // For new conversations, just set empty messages
    setMessages([]);
    console.log('📝 New conversation selected - no messages to fetch yet');
  }
};

  const handleTyping = () => {
    if (!selectedConversation || !caseManager?._id) return;

    socketService.emit('typing', {
      conversationId: [caseManager._id, selectedConversation.userId._id].sort().join('_'),
      userId: caseManager._id,
      isTyping: true
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('typing', {
        conversationId: [caseManager._id, selectedConversation.userId._id].sort().join('_'),
        userId: caseManager._id,
        isTyping: false
      });
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDateLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return formatTime(date);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // UI: loading / error / access checks
  if (profileLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-6 rounded-2xl shadow">
          <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-semibold">Error loading profile</p>
          <p className="text-sm text-gray-600 mt-2">{String(profileError)}</p>
        </div>
      </div>
    );
  }

  if (caseManager && caseManager.role !== 'case_manager' && caseManager.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-6 rounded-2xl shadow">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-800 font-semibold">Access Denied</p>
          <p className="text-sm text-gray-600 mt-2">This feature is only available to case managers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 min-h-[500px] relative">
      {/* ✅ FLOATING CHAT WIDGET BUTTON - FIXED WITH WRAPPER APPROACH */}
      {!sidebarOpen && (
        <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="relative bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full p-3 md:p-4 shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-transform transform hover:scale-105"
            aria-label="Open messages"
          >
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
            
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 md:h-7 md:w-7 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Conversations */}
      <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-40
            bg-white border-r transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}
            md:w-80 overflow-hidden
          `}
          aria-hidden={!sidebarOpen}
      >
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages
                {/* ✅ Unread count badge in header */}
                {totalUnreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-6 min-w-[24px] px-2 flex items-center justify-center animate-pulse">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {totalUnreadCount > 0 && (
                  <span className="ml-2 font-semibold">· {totalUnreadCount} unread</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md bg-white/20 hover:bg-white/30 focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm text-center">No conversations yet</p>
              <p className="text-xs text-center mt-2 text-gray-400">Users will appear here when they message you</p>
            </div>
          ) : (
            conversations.map((conv, index) => (
              <button
                key={conv._id || `new-user-${conv.userId?._id || index}`} // ✅ FIXED KEY
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-3 border-b flex items-center gap-3 hover:bg-gray-50 transition-all ${
                  selectedConversation?.userId?._id === conv.userId?._id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                    : ''
                }`}
              >
                <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {conv.userId?.username || conv.userId?.fullName || 'Anonymous'}
                        </div>
                        {conv.isNew && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500">{formatDateLabel(conv.lastMessageTime)}</div>
                      {conv.unreadCount?.caseManager > 0 && (
                        <div className="mt-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold h-6 w-6">
                          {conv.unreadCount.caseManager}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden w-full bg-white border-b flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            Messages
            {/* ✅ Mobile unread badge */}
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </h3>
        </div>
        <div className="text-xs text-gray-500">{conversations.length} conv{s(conversations.length)}</div>
      </div>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-sm">
                      {selectedConversation.userId?.username || 'Anonymous'}
                    </div>
                    {selectedConversation.isNew && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        New Assignment
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedConversation.userId?.email || ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!selectedConversation.isNew && (
                  <div className="text-xs text-gray-500">
                    Last: {formatDateLabel(selectedConversation.lastMessageTime)}
                  </div>
                )}
                <button 
                  onClick={() => { 
                    setSelectedConversation(null); 
                    if (window.innerWidth < 768) setSidebarOpen(true); 
                  }} 
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {selectedConversation.isNew 
                        ? '👋 Start a conversation with this newly assigned user'
                        : 'No messages yet — say hi 👋'}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className={`flex ${msg.isFromCaseManager ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.isFromCaseManager ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm border rounded-bl-none'}`}>
                      {!msg.isFromCaseManager && (
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-600">User</span>
                        </div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                      <div className={`flex items-center gap-1 mt-2 text-[11px] opacity-70 ${msg.isFromCaseManager ? 'justify-end' : 'justify-start'}`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-2xl max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">User is typing...</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.08s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.16s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedConversation.isNew 
                      ? "Write the first message to this user..." 
                      : "Write a message... (Enter to send, Shift+Enter for new line)"
                  }
                  className="flex-1 px-3 py-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent max-h-36"
                  rows={2}
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">Send</span>
                  </button>

                  <button
                    onClick={() => { setNewMessage(''); }}
                    title="Clear"
                    className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm">Pick a user from the list to start chatting.</p>
              {totalUnreadCount > 0 && (
                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
                    <span className="bg-red-500 text-white rounded-full h-6 min-w-[24px] px-2 flex items-center justify-center text-xs font-semibold">
                      {totalUnreadCount}
                    </span>
                    Unread message{totalUnreadCount !== 1 ? 's' : ''} waiting
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function s(n) { return n === 1 ? '' : 's'; }

export default CaseManagerMessages;