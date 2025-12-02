import { useNavigation } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';

export const useDirectMessage = () => {
    const navigation = useNavigation();
    const { createChat } = useChat();

    const startDirectChat = async (targetEmail) => {
        if (!targetEmail) return;

        // createChat logic handles finding or creating the chat
        const chat = await createChat([targetEmail]);
        
        if (chat && chat.id) {
            // Navigate to the Messaging stack, specifically the Chat Screen
            navigation.navigate('Messaging', { 
                screen: 'Conversation',
                params: { chatId: chat.id }
            });
        }
    };

    return { startDirectChat };
};