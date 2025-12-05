import { useNavigate } from 'react-router-dom';
import { useChatManager } from './useChatManager';

export const useDirectMessage = () => {
    const navigate = useNavigate();
    const { createChat } = useChatManager();

    const startDirectChat = async (targetEmail) => {
        if (!targetEmail) return;

        // createChat returns the chat object (with .id) if successful
        const chat = await createChat([targetEmail]);
        
        if (chat && chat.id) {
            navigate(`/messages/${chat.id}`); 
        }
    };

    return { startDirectChat };
};