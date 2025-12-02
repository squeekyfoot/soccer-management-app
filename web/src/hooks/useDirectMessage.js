import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

export const useDirectMessage = () => {
    const navigate = useNavigate();
    const { createChat } = useChat();

    const startDirectChat = async (targetEmail) => {
        if (!targetEmail) return;

        // createChat returns the chat object (with .id) if successful
        // It handles the logic of finding an existing 1:1 chat first
        const chat = await createChat([targetEmail]);
        
        if (chat && chat.id) {
            // Navigate to the messaging view with the specific chat ID
            navigate(`/messages/${chat.id}`); 
        }
    };

    return { startDirectChat };
};