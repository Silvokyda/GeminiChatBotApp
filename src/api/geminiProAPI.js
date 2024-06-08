import { geminiProApiKey } from '../config/config';

const GEMINI_PRO_API_URL = 'https://api.geminipro.com/chat';

export const getChatbotResponse = async (message) => {
  const response = await fetch(GEMINI_PRO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${geminiProApiKey}`
    },
    body: JSON.stringify({ message })
  });

  const data = await response.json();
  return data;
};
