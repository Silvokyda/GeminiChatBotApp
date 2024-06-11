import { geminiProApiKey } from '../config/config';
import axios from 'axios';

const GEMINI_PRO_API_URL = process.env.GEMINI_PRO_API_URL;

export const getChatbotResponse = async (message) => {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: message
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(GEMINI_PRO_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const text = response.data.candidates[0].content.parts[0].text;
    return { text };
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    return { reply: 'Sorry, I am having trouble understanding you right now.' };
  }
};
