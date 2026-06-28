import { GoogleGenAI } from "@google/genai";

const callGemini = async (title, question, allowedCategories) => {

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });


    const prompt = `
You are an academic assistant.

Title: ${title}

Question: ${question}

Instructions:

1. Provide a clear and helpful answer to the question.
2. The answer must contain between **3 and 12 sentences**. Prefer around **7–8 sentences**, but it should never be fewer than 3 sentences and never more than 12 sentences.
3. Ensure the answer is complete and does not stop mid-sentence.
4. Classify the question into EXACTLY ONE of these categories:

${allowedCategories.join(", ")}

Rules:
- Only use the given categories.
- Do not create new categories.

Return JSON only.
`;

    try {

        const Gemini_response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 600,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        answer: {
                            type: "STRING",
                            description: "Detailed answer to the question"
                        },
                        assignedCategory: {
                            type: "STRING",
                            enum: allowedCategories,
                            description: "Category selected from allowed list"
                        }
                    },
                    required: ["answer", "assignedCategory"]
                }
            }
        });

        const text = Gemini_response.text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(text);

    } catch (err) {
        console.error("Gemini error:", err);
        return null;
    }
}

export default callGemini;