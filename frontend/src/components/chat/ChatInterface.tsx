"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Database,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  User,
  Zap,
  Copy,
  Check,
  Wrench,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Textarea,
  ScrollArea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { DatabaseIcon, DbTypeBadge, EmptyState } from "@/components/shared";
import { useChatStore, type ChatMessage, type ChatToolInvocation } from "@/store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, formatRelativeTime } from "@/lib/utils";

type Connection = {
  id: string;
  label: string;
  dbType: string;
  host: string;
  databaseName: string;
};

type ChatStreamEvent =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown }
  | {
      type: "tool-result";
      toolCallId: string;
      toolName: string;
      output: unknown;
    }
  | { type: "error"; message: string };







// ── Suggested queries ─────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-7 text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-4 text-xl font-semibold leading-8 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 text-lg font-semibold leading-7 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 text-base font-semibold leading-7 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="whitespace-pre-wrap leading-7 text-foreground/95">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-7 text-foreground/95">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-indigo-400/70 pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-400 underline-offset-4 hover:underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-auto rounded-lg border border-border bg-background shadow-sm">
              <table className="w-full min-w-max border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border bg-muted/80">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/70">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-muted/35">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border-r border-border/70 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-r border-border/50 px-3 py-2 align-top text-foreground/90 last:border-r-0">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className?.includes("language-");
            return isInline ? (
              <code
                className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] text-foreground"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-auto rounded-lg border border-border bg-zinc-950 p-4 text-xs text-zinc-100">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ToolActivity({ tools }: { tools?: ChatToolInvocation[] }) {
  const [open, setOpen] = useState(true);

  if (!tools?.length) return null;

  const active = tools.some((tool) => tool.status === "running");

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-border bg-muted/25">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40"
      >
        {active ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-indigo-400" />
        )}
        <span className="flex-1">
          {active ? "Using tools" : `${tools.length} tool ${tools.length === 1 ? "call" : "calls"}`}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="space-y-2 p-3">
              {tools.map((tool) => (
                <div key={tool.id} className="rounded-md bg-background/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                    {tool.status === "running" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    )}
                    {tool.status === "complete" && (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {tool.status === "error" && (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="font-mono text-foreground">{tool.name}</span>
                    <span className="ml-auto capitalize text-muted-foreground">
                      {tool.status}
                    </span>
                  </div>
                  {tool.input !== undefined && (
                    <pre className="max-h-40 overflow-auto rounded bg-zinc-950 p-2 text-[11px] text-zinc-200">
                      {JSON.stringify(tool.input, null, 2)}
                    </pre>
                  )}
                  {tool.error && (
                    <p className="mt-2 text-xs text-destructive">{tool.error}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatMessageRow({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("group flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-indigo-500 text-white"
            : "bg-foreground text-background",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
      </div>

      <div className={cn("max-w-[86%] space-y-1", isUser && "items-end")}>
        <div
          className={cn(
            "text-sm leading-relaxed",
            isUser
              ? "rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white"
              : "px-1 py-1 text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <ToolActivity tools={message.toolInvocations} />
              {message.content ? (
                <MarkdownContent content={message.content} />
              ) : (
                <div className="flex items-center gap-2 py-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              )}
              {isStreaming && message.content && (
                <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded bg-indigo-400 align-text-bottom" />
              )}
            </>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(message.timestamp)}
          </span>
          <button
            onClick={copy}
            className="rounded p-1 hover:bg-muted"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const SUGGESTIONS = [
  "Show me all tables / collections",
  "How many records are in the main table?",
  "Show me the 10 most recent records",
  "Describe my database schema",
  "Find any records created today",
  "What are the most common values in each column?",
];

function SuggestedQueries({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="py-8 flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4">
        <Zap className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-semibold mb-1">Ask anything about your database</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Select a connection above and start with a suggestion
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-muted-foreground hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Conversation sidebar item ─────────────────────────────────────────────────
function ConvItem({
  conv,
  isActive,
  onSelect,
  onDelete,
}: {
  conv: { id: string; title: string };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer group transition-all",
        isActive
          ? "bg-indigo-500/10 border border-indigo-500/20"
          : "hover:bg-muted/50",
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm truncate">{conv.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all rounded"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Main ChatInterface ────────────────────────────────────────────────────────
export function ChatInterface({ connections }: { connections: Connection[] }) {
  const {
    conversations,
    activeConversationId,
    selectedConnectionId,
    isStreaming,
    setActiveConversation,
    setSelectedConnection,
    setIsStreaming,
    createConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
  } = useChatStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const selectedConn =
    connections.find((c) => c.id === selectedConnectionId) ?? connections[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleNewChat = () => {
    const id = createConversation();
    setActiveConversation(id);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    if (!selectedConn) {
      toast.error("Select a database connection first");
      return;
    }

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
      setActiveConversation(convId);
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    addMessage(convId, userMsg);
    setInput("");
    setIsStreaming(true);

    // Add empty AI message to stream into
    const aiMsgId = crypto.randomUUID();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    addMessage(convId, aiMsg);

    try {
      const history = activeConv?.messages ?? [];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          connectionId: selectedConn.id,
          dbType: selectedConn.dbType,
          dbName: selectedConn.databaseName,
          host: selectedConn.host,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffered = "";
      const toolInvocations: ChatToolInvocation[] = [];

      const applyEvent = (event: ChatStreamEvent) => {
        if (event.type === "text") {
          accumulated += event.text;
          return;
        }

        if (event.type === "tool-call") {
          toolInvocations.push({
            id: event.toolCallId,
            name: event.toolName,
            input: event.input,
            status: "running",
          });
          return;
        }

        if (event.type === "tool-result") {
          const tool = toolInvocations.find(
            (item) => item.id === event.toolCallId,
          );
          if (tool) {
            tool.output = event.output;
            tool.status = "complete";
          }
          return;
        }

        const runningTool = [...toolInvocations]
          .reverse()
          .find((item) => item.status === "running");
        if (runningTool) {
          runningTool.status = "error";
          runningTool.error = event.message;
        } else {
          accumulated += `\n\n${event.message}`;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });

        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          applyEvent(JSON.parse(line) as ChatStreamEvent);
        }

        updateLastMessage(convId, accumulated, [...toolInvocations]);
      }

      if (buffered.trim()) {
        applyEvent(JSON.parse(buffered) as ChatStreamEvent);
      }

      updateLastMessage(convId, accumulated, [...toolInvocations]);
    } catch (e) {
      updateLastMessage(
        convId,
        "Sorry, something went wrong. Please try again.",
      );
      toast.error("Chat error");
    } finally {
      setIsStreaming(false);
    }
  }, [
    input,
    isStreaming,
    selectedConn,
    activeConversationId,
    activeConv,
    addMessage,
    createConversation,
    setActiveConversation,
    setIsStreaming,
    updateLastMessage,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] bg-background sm:-m-6">
      {/* Conversation sidebar */}
      <div className="hidden w-72 shrink-0 flex-col gap-3 border-r border-border bg-card/40 p-4 lg:flex">
        <Button
          onClick={handleNewChat}
          variant="outline"
          className="gap-2 w-full"
        >
          <Plus className="w-4 h-4" /> New chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConversationId}
                  onSelect={() => setActiveConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Chat top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Querying:
            </span>
            {connections.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No connections — add one first
              </span>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-sm">
                    <DatabaseIcon
                      type={selectedConn?.dbType ?? "postgresql"}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">
                      {selectedConn?.label ?? "Select connection"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {connections.map((conn) => (
                    <DropdownMenuItem
                      key={conn.id}
                      onClick={() => setSelectedConnection(conn.id)}
                      className={cn(
                        "gap-2",
                        conn.id === selectedConnectionId && "bg-indigo-500/10",
                      )}
                    >
                      <DatabaseIcon type={conn.dbType} className="w-4 h-4" />
                      <span>{conn.label}</span>
                      <DbTypeBadge type={conn.dbType} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="lg:hidden">
            <Button onClick={handleNewChat} variant="ghost" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            <SuggestedQueries
              onSelect={(q) => {
                setInput(q);
                textareaRef.current?.focus();
              }}
            />
          ) : (
            <div className="space-y-5 max-w-4xl mx-auto">
              <AnimatePresence>
                {activeConv.messages.slice(0, -1).map((msg) => (
                  <ChatMessageRow key={msg.id} message={msg} />
                ))}
                {activeConv.messages.length > 0 &&
                  (isStreaming &&
                  activeConv.messages[activeConv.messages.length - 1].role ===
                    "assistant" ? (
                    <ChatMessageRow
                      key={
                        activeConv.messages[activeConv.messages.length - 1].id
                      }
                      message={
                        activeConv.messages[activeConv.messages.length - 1]
                      }
                      isStreaming
                    />
                  ) : (
                    <ChatMessageRow
                      key={
                        activeConv.messages[activeConv.messages.length - 1].id
                      }
                      message={
                        activeConv.messages[activeConv.messages.length - 1]
                      }
                    />
                  ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="px-4 pb-4 pt-3 border-t border-border bg-background/95 shrink-0">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your database..."
                className="min-h-[48px] max-h-[120px] pr-4 py-3 resize-none text-sm"
                disabled={isStreaming || connections.length === 0}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={
                !input.trim() || isStreaming || connections.length === 0
              }
              size="icon"
              className="h-12 w-12 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
