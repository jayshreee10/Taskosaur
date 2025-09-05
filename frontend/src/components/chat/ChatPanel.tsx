import { useState, useEffect, useRef, useCallback } from 'react';
import { HiXMark, HiPaperAirplane, HiSparkles } from 'react-icons/hi2';
import { useChatContext } from '@/contexts/chat-context';
import { mcpServer, extractContextFromPath } from '@/lib/mcp-server';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function ChatPanel() {
  const { isChatOpen, toggleChat } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { getCurrentUser } = useAuth();

  // Initialize services on mount
  useEffect(() => {
    // Get current user
    const currentUser = getCurrentUser();
    const token = localStorage.getItem('access_token');
    
    
    setUser(currentUser);
    
    if (token && currentUser) {
      // Initialize MCP server with context
      const pathContext = extractContextFromPath(pathname);
      
      mcpServer.initialize({
        currentUser: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.email
        },
        ...pathContext
      });
    }
  }, [pathname, getCurrentUser]);

  // Update context when path changes
  useEffect(() => {
    if (user) {
      const pathContext = extractContextFromPath(pathname);
      mcpServer.updateContext(pathContext);
    }
  }, [pathname, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stable callback for handling streaming chunks
  const handleChunk = useCallback((chunk: string) => {
    setMessages(prev => {
      const updatedMessages = [...prev];
      const lastMessageIndex = updatedMessages.length - 1;
      const lastMessage = updatedMessages[lastMessageIndex];
      
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
        // Create a new message object instead of mutating
        updatedMessages[lastMessageIndex] = {
          ...lastMessage,
          content: lastMessage.content + chunk
        };
      }
      return updatedMessages;
    });
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Rate limiting check (removed - handled by service now)

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Create streaming message placeholder
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Let backend handle all validation
      await mcpServer.processMessage(userMessage.content, {
        stream: true,
        onChunk: handleChunk
      });

      // Mark streaming as complete
      setMessages(prev => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return updatedMessages;
      });

    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');
      
      // Remove the streaming placeholder message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    mcpServer.clearHistory();
  };

  return (
    <>
      {/* Chat Panel - positioned below header */}
      <div 
        className={`fixed top-[64px] right-0 bottom-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-40 transform transition-transform duration-300 ease-in-out ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '400px' }}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
            <button
              onClick={toggleChat}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <HiXMark className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <HiSparkles className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="font-medium">Hi! I'm your Taskosaur AI Assistant.</p>
              <p className="text-sm mt-2">Try these commands:</p>
              <ul className="text-sm mt-3 space-y-1 text-left max-w-xs mx-auto">
                <li>• "Create a task called [name]"</li>
                <li>• "Show high priority tasks"</li>
                <li>• "Mark [task] as done"</li>
                <li>• "Create a workspace called [name]"</li>
                <li>• "List my projects"</li>
                <li>• "Navigate to [workspace] workspace"</li>
              </ul>
              <p className="text-xs mt-3 text-gray-400">I'll execute these actions for you!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </div>
                    {message.timestamp && (
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                !user 
                  ? "Please log in to use AI assistant..." 
                  : "Type your message..."
              }
              disabled={isLoading}
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '38px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiPaperAirplane className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Global styles for content squeeze */}
      <style jsx global>{`
        body.chat-open .flex-1.overflow-y-scroll {
          margin-right: 400px !important;
          transition: margin-right 300ms ease-in-out;
        }
        
        .flex-1.overflow-y-scroll {
          transition: margin-right 300ms ease-in-out;
        }
      `}</style>
    </>
  );
}