import { create } from 'zustand';
import api from '../services/api';

const useChatStore = create((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: {}, // Map of userId -> Message[]
    isLoading: false,
    error: null,
    isTyping: false,

    setConversations: (conversations) => set({ conversations }),

    setActiveConversation: (user) => {
        set({ activeConversation: user });
        if (!get().messages[user.id]) {
            get().fetchMessages(user.id);
        }
    },

    addMessage: (message, currentUserId) => {
        const { messages, conversations } = get();
        // Identify the "other" user ID
        const otherId = message.senderId === currentUserId ? message.receiverId : message.senderId;

        // Update messages map
        const newMessages = {
            ...messages,
            [otherId]: [...(messages[otherId] || []), message]
        };

        // Update conversations list
        let newConversations = [...conversations];
        // Weak comparison to handle string/number mismatch
        const convIndex = conversations.findIndex(c => c.otherUser?.id == otherId);

        if (convIndex !== -1) {
            const updatedConv = {
                ...newConversations[convIndex],
                lastMessage: message,
                unreadCount: message.senderId !== currentUserId ? (newConversations[convIndex].unreadCount || 0) + 1 : 0
            };
            newConversations.splice(convIndex, 1);
            newConversations.unshift(updatedConv);
        } else {
            // If new conversation, we simply refresh the list from backend to get full user details
            get().fetchConversations();
            // But we MUST update messages state regardless
        }

        set({ messages: newMessages, conversations: newConversations });
    },

    fetchConversations: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/messages'); // Endpoint is /api/messages for conversations
            set({ conversations: response.data.conversations, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load conversations', isLoading: false });
        }
    },

    fetchMessages: async (userId) => {
        try {
            const response = await api.get(`/messages/${userId}`);
            const messages = get().messages;
            set({
                messages: { ...messages, [userId]: response.data.messages }
            });
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    },

    deleteConversation: async (partnerId) => {
        try {
            await api.delete(`/messages/conversations/${partnerId}`);
            const { conversations, messages, activeConversation } = get();

            // Remove from conversations list
            const newConversations = conversations.filter(c => c.otherUser?.id != partnerId && c.id != partnerId);

            // Remove messages from cache
            const newMessages = { ...messages };
            delete newMessages[partnerId];

            // If active, clear it
            const newActive = activeConversation && activeConversation.id == partnerId ? null : activeConversation;

            set({
                conversations: newConversations,
                messages: newMessages,
                activeConversation: newActive
            });
            return true;
        } catch (error) {
            console.error("Failed to delete conversation", error);
            return false;
        }
    },

    // Optimistic update for sending
    sendOptimisticMessage: (tempMessage) => {
        const { messages } = get();
        const otherId = tempMessage.receiverId;
        set({
            messages: {
                ...messages,
                [otherId]: [...(messages[otherId] || []), tempMessage]
            }
        });
    },

    updateUserStatus: (userId, isOnline) => {
        const { conversations, activeConversation } = get();

        // Update in conversations list
        const newConversations = conversations.map(c => {
            if (c.otherUser?.id == userId) {
                return { ...c, otherUser: { ...c.otherUser, isOnline } };
            }
            return c;
        });

        // Update active conversation if it's the same user
        let newActive = activeConversation;
        if (activeConversation?.id == userId) {
            newActive = { ...activeConversation, isOnline };
        }

        set({ conversations: newConversations, activeConversation: newActive });
    }
}));

export default useChatStore;
