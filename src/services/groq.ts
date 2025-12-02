import { GoogleGenerativeAI } from "@google/generative-ai"; // Not needed for Groq, just using fetch

export const explainCodeWithGroq = async (code: string, output: string, language: string) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("API Key missing. Please check .env file.");
  }

  const prompt = `
    You are a friendly coding tutor. The student is writing ${language} code.
    
    CODE:
    ${code}
    
    OUTPUT/ERROR:
    ${output}
    
    Task:
    1. If there is an error, explain it simply and tell them how to fix it.
    2. If the code works, briefly explain what it does.
    3. Be concise (max 3 sentences). Do not use markdown headers.
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192", // Extremely fast model
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.statusText}`);

    const data = await response.json();
    return data.choices[0]?.message?.content || "Could not generate explanation.";
  } catch (error) {
    console.error("AI Error:", error);
    return "I couldn't reach the AI tutor right now. Please check your internet or API key.";
  }
};
