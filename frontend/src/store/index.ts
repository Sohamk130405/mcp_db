import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DbConnection, ApiKey } from "@/lib/schema";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolInvocations?: ChatToolInvocation[];
}

export interface ChatToolInvocation {
  id: string;
  name: string;
  input?: unknown;
  output?: unknown;
  status: "running" | "complete" | "error";
  error?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  connectionId?: string;
  createdAt: Date;
}

interface ConnectionsState {
  connections: DbConnection[];
  setConnections: (connections: DbConnection[]) => void;
  addConnection: (conn: DbConnection) => void;
  removeConnection: (id: string) => void;
}

interface ApiKeysState {
  apiKeys: ApiKey[];
  setApiKeys: (keys: ApiKey[]) => void;
  addApiKey: (key: ApiKey) => void;
  removeApiKey: (id: string) => void;
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  selectedConnectionId: string | null;
  isStreaming: boolean;
  setActiveConversation: (id: string | null) => void;
  setSelectedConnection: (id: string | null) => void;
  setIsStreaming: (val: boolean) => void;
  createConversation: () => string;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateLastMessage: (
    conversationId: string,
    content: string,
    toolInvocations?: ChatToolInvocation[],
  ) => void;
  deleteConversation: (id: string) => void;
  clearConversations: () => void;
}

interface OnboardingState {
  step: number;
  setStep: (step: number) => void;
  completedSteps: number[];
  markStepComplete: (step: number) => void;
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  setConnections: (connections) => set({ connections }),
  addConnection: (conn) =>
    set((s) => ({ connections: [...s.connections, conn] })),
  removeConnection: (id) =>
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),
}));

export const useApiKeysStore = create<ApiKeysState>((set) => ({
  apiKeys: [],
  setApiKeys: (apiKeys) => set({ apiKeys }),
  addApiKey: (key) => set((s) => ({ apiKeys: [...s.apiKeys, key] })),
  removeApiKey: (id) =>
    set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== id) })),
}));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      selectedConnectionId: null,
      isStreaming: false,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      setSelectedConnection: (id) => set({ selectedConnectionId: id }),
      setIsStreaming: (val) => set({ isStreaming: val }),
      createConversation: () => {
        const id = crypto.randomUUID();
        const conv: ChatConversation = {
          id,
          title: "New conversation",
          messages: [],
          createdAt: new Date(),
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },
      addMessage: (conversationId, message) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages, message];
            const title =
              msgs.length === 1 && message.role === "user"
                ? message.content.substring(0, 40)
                : c.title;
            return { ...c, messages: msgs, title };
          }),
        }));
      },
      updateLastMessage: (conversationId, content, toolInvocations) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages];
            if (msgs.length > 0) {
              msgs[msgs.length - 1] = {
                ...msgs[msgs.length - 1],
                content,
                ...(toolInvocations ? { toolInvocations } : {}),
              };
            }
            return { ...c, messages: msgs };
          }),
        }));
      },
      deleteConversation: (id) => {
        const { conversations, activeConversationId } = get();
        const remaining = conversations.filter((c) => c.id !== id);
        set({
          conversations: remaining,
          activeConversationId:
            activeConversationId === id
              ? (remaining[0]?.id ?? null)
              : activeConversationId,
        });
      },
      clearConversations: () =>
        set({ conversations: [], activeConversationId: null }),
    }),
    { name: "dbtalk-chat" }
  )
);

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  completedSteps: [],
  setStep: (step) => set({ step }),
  markStepComplete: (step) =>
    set((s) => ({
      completedSteps: s.completedSteps.includes(step)
        ? s.completedSteps
        : [...s.completedSteps, step],
    })),
}));
