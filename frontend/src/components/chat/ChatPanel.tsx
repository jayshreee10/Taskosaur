import { useState, useEffect, useRef, useCallback } from "react";
import {
  HiXMark,
  HiPaperAirplane,
  HiSparkles,
  HiArrowPath,
} from "react-icons/hi2";
import { useChatContext } from "@/contexts/chat-context";
import { mcpServer, extractContextFromPath } from "@/lib/mcp-server";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button, Textarea } from "../ui";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const { isChatOpen, toggleChat } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isContextManuallyCleared, setIsContextManuallyCleared] =
    useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { getCurrentUser } = useAuth();

  // Load messages from session storage (improved logic)
  const loadMessagesFromHistory = useCallback(() => {
    try {
      // Only load if we don't have any messages yet
      if (messages.length > 0) {
        console.log(
          "[Chat] Skipping session storage load - messages already present"
        );
        return false;
      }

      const storedHistory = sessionStorage.getItem("mcp_conversation_history");
      if (storedHistory) {
        const chatHistory: ChatMessage[] = JSON.parse(storedHistory);

        // Only load if we have substantial history (more than just a greeting)
        if (chatHistory.length > 2) {
          const convertedMessages: Message[] = chatHistory.map(
            (msg, index) => ({
              role: msg.role === "system" ? "assistant" : msg.role,
              content: msg.content,
              timestamp: new Date(
                Date.now() - (chatHistory.length - index) * 1000
              ),
              isStreaming: false,
            })
          );

          console.log(
            `[Chat] Loaded ${convertedMessages.length} messages from session storage`
          );
          setMessages(convertedMessages);
          return true;
        }
      }
    } catch (error) {
      console.warn("Failed to load messages from session storage:", error);
    }
    return false;
  }, [messages.length]);

  // Initialize services on mount
  useEffect(() => {
    // Get current user
    const currentUser = getCurrentUser();
    const token = localStorage.getItem("access_token");

    setUser(currentUser);

    if (token && currentUser) {
      // Initialize MCP server with context
      const pathContext = extractContextFromPath(pathname);

      mcpServer.initialize({
        currentUser: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.email,
        },
        ...pathContext,
      });

      // Load existing conversation history
      loadMessagesFromHistory();
    }
  }, [pathname, getCurrentUser, loadMessagesFromHistory]);

  // Update context when path changes (unless manually cleared)
  useEffect(() => {
    if (user && !isContextManuallyCleared) {
      const pathContext = extractContextFromPath(pathname);
      mcpServer.updateContext(pathContext);
    }
  }, [pathname, user, isContextManuallyCleared]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for workspace/project creation events
  useEffect(() => {
    const handleWorkspaceCreated = (event: CustomEvent) => {
      const { workspaceSlug, workspaceName } = event.detail;
      console.log("[Chat] Workspace created, navigating to:", workspaceSlug);

      // Navigate to the new workspace
      router.push(`/${workspaceSlug}`);

      // Add a system message indicating navigation
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `✅ Navigated to workspace: ${workspaceName}`,
          timestamp: new Date(),
        },
      ]);
    };

    const handleProjectCreated = (event: CustomEvent) => {
      const { workspaceSlug, projectSlug, projectName } = event.detail;
      console.log(
        "[Chat] Project created, navigating to:",
        `${workspaceSlug}/${projectSlug}`
      );

      // Navigate to the new project
      router.push(`/${workspaceSlug}/${projectSlug}`);

      // Add a system message indicating navigation
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `✅ Navigated to project: ${projectName}`,
          timestamp: new Date(),
        },
      ]);
    };

    // Add event listeners
    if (typeof window !== "undefined") {
      window.addEventListener(
        "aiWorkspaceCreated",
        handleWorkspaceCreated as EventListener
      );
      window.addEventListener(
        "aiProjectCreated",
        handleProjectCreated as EventListener
      );

      return () => {
        window.removeEventListener(
          "aiWorkspaceCreated",
          handleWorkspaceCreated as EventListener
        );
        window.removeEventListener(
          "aiProjectCreated",
          handleProjectCreated as EventListener
        );
      };
    }
  }, [router]);

  // Stable callback for handling streaming chunks
  const handleChunk = useCallback((chunk: string) => {
    console.log("[Chat] Received chunk:", chunk); // Debug log
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const lastMessageIndex = updatedMessages.length - 1;
      const lastMessage = updatedMessages[lastMessageIndex];

      if (
        lastMessage &&
        lastMessage.role === "assistant" &&
        lastMessage.isStreaming
      ) {
        // Create a new message object instead of mutating
        updatedMessages[lastMessageIndex] = {
          ...lastMessage,
          content: lastMessage.content + chunk,
        };
      } else {
        console.warn("[Chat] No streaming message found to append chunk to", {
          lastMessage,
        });
      }
      return updatedMessages;
    });
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    console.log("[Chat] Sending message:", inputValue); // Debug log

    // If user sends a message with workspace/project specification, clear the manual flag
    if (
      inputValue.toLowerCase().includes("workspace") ||
      inputValue.toLowerCase().includes("project")
    ) {
      setIsContextManuallyCleared(false);
      console.log("[Chat] Re-enabling automatic context detection");
    }

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      console.log("[Chat] Adding user message to state");
      return [...prev, userMessage];
    });
    setInputValue("");
    setIsLoading(true);
    setError(null);

    // Create streaming message placeholder
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => {
      console.log("[Chat] Adding streaming placeholder");
      return [...prev, assistantMessage];
    });

    try {
      // Let backend handle all validation
      await mcpServer.processMessage(userMessage.content, {
        stream: true,
        onChunk: handleChunk,
      });

      // Mark streaming as complete and sync final content
      setMessages((prev) => {
        console.log("[Chat] Marking streaming as complete");
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          lastMessage.isStreaming
        ) {
          lastMessage.isStreaming = false;

          // Sync final content from MCP history to ensure consistency
          try {
            const mcpHistory = mcpServer.getHistory();
            if (mcpHistory.length > 0) {
              const lastMcpMessage = mcpHistory[mcpHistory.length - 1];
              if (
                lastMcpMessage.role === "assistant" &&
                lastMcpMessage.content
              ) {
                // Only sync if the MCP content is substantially longer (indicating it has the full content)
                if (
                  lastMcpMessage.content.length > lastMessage.content.length
                ) {
                  console.log("[Chat] Syncing final content from MCP history");
                  lastMessage.content = lastMcpMessage.content;
                }
              }
            }
          } catch (error) {
            console.warn("[Chat] Failed to sync final content:", error);
          }
        } else {
          console.warn(
            "[Chat] No streaming assistant message found to mark as complete"
          );
        }
        return updatedMessages;
      });
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to send message");

      // Remove the streaming placeholder message
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    mcpServer.clearHistory();
  };

  const clearContext = async () => {
    try {
      // Clear the context both locally and on backend
      await mcpServer.clearContext();

      // Set flag to prevent automatic context extraction from URL
      setIsContextManuallyCleared(true);

      // Also clear the history to ensure clean context
      mcpServer.clearHistory();

      // Clear the local messages but keep the context clear message
      setMessages([
        {
          role: "system",
          content:
            "🔄 Context cleared. You are now in global mode - specify workspace and project for your next actions.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to clear context:", error);
      setError("Failed to clear context. Please try again.");
    }
  };
  // Improved sync logic that only runs on mount/chat open, not during active messaging
  useEffect(() => {
    const syncWithMcpHistory = () => {
      try {
        // Skip sync if context was manually cleared or if user is actively messaging
        if (isContextManuallyCleared || isLoading) {
          console.log(
            "[Chat] Skipping sync - context cleared or messaging in progress"
          );
          return;
        }

        const mcpHistory = mcpServer.getHistory();

        // Only sync if we have significant history and no current streaming
        if (mcpHistory.length > 2 && !messages.some((m) => m.isStreaming)) {
          const currentHistoryLength = messages.filter(
            (m) => m.role !== "system" || !m.content.includes("Context cleared")
          ).length;

          // Only sync if there's a meaningful difference (more than 1 message gap)
          if (Math.abs(mcpHistory.length - currentHistoryLength) > 1) {
            console.log("[Chat] Syncing UI messages with MCP server history");

            const syncedMessages: Message[] = mcpHistory.map(
              (msg: ChatMessage, index: number) => ({
                role: msg.role === "system" ? "assistant" : msg.role,
                content: msg.content,
                timestamp:
                  messages[index]?.timestamp ||
                  new Date(Date.now() - (mcpHistory.length - index) * 1000),
                isStreaming: false,
              })
            );

            // Preserve system messages from manual context clearing
            const systemMessages = messages.filter(
              (m) =>
                m.role === "system" && m.content.includes("Context cleared")
            );
            setMessages([...systemMessages, ...syncedMessages]);
          }
        }
      } catch (error) {
        console.warn("Failed to sync with MCP history:", error);
      }
    };

    // Only sync on initial load when chat opens, not continuously
    if (isChatOpen && user && !isContextManuallyCleared && !isLoading) {
      const timeout = setTimeout(syncWithMcpHistory, 500); // Longer delay to avoid conflicts
      return () => clearTimeout(timeout);
    }
  }, [isChatOpen, user]); // Removed messages.length to prevent continuous triggering

  return (
    <>
      {/* Chat Panel - positioned below header */}
      <div
        role="chat-panel"
        className={`fixed bg-[var(--background)] top-0 right-0 bottom-0 border-l border-[var(--border)] z-9999 transform transition-transform duration-400 ease-in-out
          ${
            isChatOpen ? "translate-x-0" : "translate-x-full"
          } w-full xl:w-[400px]  `}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] h-[65px] px-4">
          <div className="flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-primary">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Context Clear Button */}
            <Button
              variant="ghost"
              onClick={clearContext}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-primary transition-colors"
              title="Clear workspace/project context"
            >
              <HiArrowPath className="w-3 h-3" />
              Context
            </Button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-[var(--muted)] hover:text-primary"
              >
                Clear
              </button>
            )}
            <Button
              variant="ghost"
              onClick={toggleChat}
              className=" rounded-lg hover:bg-[var(--accent)] transition-colors "
            >
              <HiXMark className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ height: "calc(100% - 140px)" }}
        >
          {messages.length === 0 ? (
            <div className="text-center text-[var(--muted-foreground)] mt-8">
              <HiSparkles className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
              <p className="font-medium">
                Hi! I'm your Taskosaur AI Assistant.
              </p>
              <p className="text-sm mt-2">Try these commands:</p>
              <ul className="text-sm mt-3 space-y-1 text-left max-w-xs mx-auto">
                <li>• "Create a task called [name]"</li>
                <li>• "Show high priority tasks"</li>
                <li>• "Mark [task] as done"</li>
                <li>• "Create a workspace called [name]"</li>
                <li>• "List my projects"</li>
                <li>• "Navigate to [workspace] workspace"</li>
              </ul>
              <p className="text-xs mt-3 text-[var(--muted-foreground)]">
                I'll execute these actions for you!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.role === "user"
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : message.role === "system"
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </div>
                    {message.timestamp && (
                      <div
                        className={`text-xs mt-1 ${
                          message.role === "user"
                            ? "text-gray-300 dark:text-gray-600"
                            : message.role === "system"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]">
          <div className="flex items-end gap-2">
            <Textarea
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
              className="px-4 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all duration-200 rounded-xl shadow-sm hover:shadow-md "
              style={{ minHeight: "38px", maxHeight: "120px" }}
              
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-[var(--primary)]/80 hover:bg-[var(--primary)] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors "
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiPaperAirplane className="w-4 h-4 text-[var(--primary-foreground)]" />
              )}
            </Button>
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
