import { geminiProApiKey } from '../config/config';
import axios from 'axios';

const GEMINI_PRO_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash-latest:generateContent'; 

export const getChatbotResponse = async (message) => {
  try {
    const response = await axios.post(GEMINI_PRO_API_URL, {
      prompt: {
        text: message
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiProApiKey}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    return { reply: 'Sorry, I am having trouble understanding you right now.' };
  }
};
