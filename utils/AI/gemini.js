import { GoogleGenAI } from "@google/genai";


// GEMINI API CALL
const callGemini = async (question) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    try {
        const Gemini_response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: question,
            config: {
                temperature: 0.4,           //set how the accuraete the response should be (0.2 to 2.0)
                maxOutputTokens: 600       //set the maximum number of tokens in the response 1 token = 0.75 words
            }
        });
        return Gemini_response.text;
    }
    catch (err) {
        console.log("Gemini error:", err);
        return "";
    }
}

export default callGemini;