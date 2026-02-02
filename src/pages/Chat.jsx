import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import socketService from '../services/socket';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { toast } from 'react-hot-toast';

export default function Chat() {
    const { token, user } = useAuthStore();
    const { addMessage, activeConversation } = useChatStore();



    useEffect(() => {
        if (token) {
            console.log('🔌 Connecting socket with token...');
            const socket = socketService.connect(token);

            socket.on('connect', () => {
                console.log('✅ Socket connected:', socket.id);
            });

            socket.on('connect_error', (err) => {
                console.error('❌ Socket connection error:', err);
                toast.error('Socket connection failed');
            });

            socket.on('receive_message', (data) => {
                console.log('📨 Message received:', data);
                addMessage(data.message, user.id);
            });

            // Handle user status updates
            socket.on('user_online', (data) => {
                console.log('🟢 User online:', data.username);
                useChatStore.getState().updateUserStatus(data.userId, true);
            });

            socket.on('user_offline', (data) => {
                console.log('⚫ User offline:', data.username);
                useChatStore.getState().updateUserStatus(data.userId, false);
            });

            // Handle read receipts
            socket.on('messages_read', (data) => {
                console.log('👁️ Messages read:', data);
                // The 'readBy' is the user who read the message (our partner)
                useChatStore.getState().markMessagesAsRead(data.readBy, data.messageIds);
            });

            socket.on('message_updated', (data) => {
                console.log('✏️ Message updated:', data);
                useChatStore.getState().updateMessage(data.id, data.content, data.senderId);
            });

            // We can also listen for 'messageSent' confirmation implies success of our own messages
            // But we did optimistic updates already.

            return () => {
                socketService.disconnect();
            };
        }
    }, [token, addMessage, user.id]);

    return (
        <div className="h-screen bg-gray-50 flex items-center justify-center md:p-4">
            <div className="w-full h-full md:max-w-[1400px] md:h-[90vh] bg-white md:rounded-2xl shadow-2xl overflow-hidden flex ring-1 ring-gray-900/5">
                {/* Responsive Layout Logic */}
                <div className={`${activeConversation ? 'hidden md:block' : 'w-full'} md:w-auto h-full border-r border-gray-100`}>
                    <Sidebar />
                </div>

                <div className={`${!activeConversation ? 'hidden md:flex' : 'w-full flex'} flex-1 h-full`}>
                    <ChatArea />
                </div>
            </div>
        </div>
    );
}
