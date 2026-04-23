import { GoogleGenerativeAI } from "@google/generative-ai";
import CircuitBreaker from "opossum";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

// The core function that calls Gemini
const callGeminiAPI = async (prompt: string) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Configure the Circuit Breaker
const breakerOptions = {
  timeout: 15000, // If Gemini takes longer than 15s, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30s, try one request to see if the API is back up
};

const geminiBreaker = new CircuitBreaker(callGeminiAPI, breakerOptions);

// Fallback function: This runs if the breaker is OPEN or if a request fails/times out
geminiBreaker.fallback(() => {
  console.warn("[Circuit Breaker] Gemini API is down or timing out. Returning fallback message.");
  return "RepoLens AI is currently experiencing high load or the LLM provider is down. Please try again later. We gracefully degraded to protect system stability.";
});

// Event listeners for observability
geminiBreaker.on('open', () => console.warn(`[Circuit Breaker] OPEN: Gemini API is struggling! Halting requests for ${breakerOptions.resetTimeout / 1000}s.`));
geminiBreaker.on('halfOpen', () => console.log('[Circuit Breaker] HALF-OPEN: Testing if Gemini API is back online...'));
geminiBreaker.on('close', () => console.log('[Circuit Breaker] CLOSED: Gemini API is healthy again.'));

export const generateAnswer = async (prompt: string) => {
  // Use the circuit breaker to execute the API call
  return await geminiBreaker.fire(prompt);
};