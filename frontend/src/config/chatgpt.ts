/**
 * ChatGPT Configuration
 * Handles API key management and configuration
 */

// In production, this should be stored in environment variables
export const CHATGPT_CONFIG = {
  API_KEY: import.meta.env.VITE_CHATGPT_API_KEY || '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',
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  API_URL: 'https://api.openai.com/v1/chat/completions',
};

export const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into PipLinePro, a comprehensive financial management system. 

Your role is to:
- Provide clear, concise, and accurate responses
- Help users understand their financial data and business insights
- Assist with data analysis and interpretation
- Answer general business and technical questions
- Maintain a professional and helpful tone

Focus areas:
- Financial data analysis and insights
- Business intelligence and reporting
- Transaction processing and PSP management
- Client relationship management
- System usage and troubleshooting

Always be helpful, accurate, and maintain user privacy and data security.`;

export const validateApiKey = (apiKey: string): boolean => {
  return Boolean(apiKey) && apiKey.startsWith('sk-') && apiKey.length > 20;
};

export default CHATGPT_CONFIG;
