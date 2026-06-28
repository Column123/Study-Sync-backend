import { CohereClient } from "cohere-ai";

// COHERE API CALL   

const callCohere = async (title, question) => {
    const cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
    });

    const prompt = `
    Title: ${title}
    Question: ${question}
    
    Task: Provide a clear and complete answer in **10 to 12 sentences maximum**.
    Do not exceed 8 sentences and ensure the explanation finishes properly.
    `;

    try {
        const Cohere_response = await cohere.chat({
            model: "command-a-03-2025",
            message: prompt,
            maxTokens: 500

        });

        return Cohere_response.text;

    } catch (error) {
        console.error("Cohere error:", error);
        return "";
    }
}
export default callCohere;
