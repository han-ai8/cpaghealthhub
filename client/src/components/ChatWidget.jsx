import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Shield, Clock } from 'lucide-react';

const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Sample chat messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to our anonymous social network. How can I help you today?",
      isAdmin: true,
      timestamp: "10:30 AM",
      time: new Date(Date.now() - 3600000)
    },
    {
      id: 2,
      text: "Hi admin, I have a question about privacy settings.",
      isAdmin: false,
      timestamp: "10:32 AM",
      time: new Date(Date.now() - 3480000)
    },
    {
      id: 3,
      text: "I'd be happy to help you with privacy settings. What specific aspect would you like to know about?",
      isAdmin: true,
      timestamp: "10:33 AM",
      time: new Date(Date.now() - 3420000)
    },
    {
      id: 4,
      text: "How can I make sure my posts remain completely anonymous?",
      isAdmin: false,
      timestamp: "10:35 AM",
      time: new Date(Date.now() - 3300000)
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    const message = {
      id: messages.length + 1,
      text: newMessage,
      isAdmin: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      time: new Date()
    };

    setMessages([...messages, message]);
    setNewMessage('');
    
    // Simulate admin typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const adminReply = {
        id: messages.length + 2,
        text: "Thank you for your message. I'll get back to you shortly with more information.",
        isAdmin: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        time: new Date()
      };
      setMessages(prev => [...prev, adminReply]);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm md:w-96 h-[500px] md:h-[600px] flex flex-col border">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Admin Support</h3>
                <p className="text-xs text-blue-200">Online now</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${
                    message.isAdmin
                      ? 'bg-white text-gray-800 shadow-sm border'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.isAdmin && (
                    <div className="flex items-center space-x-1 mb-1">
                      <Shield className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Admin</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div className={`flex items-center space-x-1 mt-1 ${
                    message.isAdmin ? 'justify-start' : 'justify-end'
                  }`}>
                    <Clock className="w-3 h-3 opacity-60" />
                    <span className="text-xs opacity-60">{message.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg max-w-xs">
                  <div className="flex items-center space-x-1 mb-1">
                    <Shield className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Admin</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to admin..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-20"
                rows="1"
              />
              <button
                onClick={sendMessage}
                disabled={newMessage.trim() === ''}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your identity remains anonymous. Only message content is shared with admin.
            </p>
          </div>
        </div>
      )}

      {/* Mobile Overlay for better mobile experience */}
      {isChatOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-25 -z-10" onClick={() => setIsChatOpen(false)} />
      )}
    </div>
  );
};

export default ChatWidget;