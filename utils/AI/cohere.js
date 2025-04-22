import { CohereClient } from "cohere-ai";

// COHERE API CALL   
const callCohere = async (question) => {
    const cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
    });
    try {
        const Cohere_response = await cohere.chat({
            model: "command-r-plus",             // or "command", "command-light", etc.
            message: question,
            max_tokens: 500,
        });
        return Cohere_response.text;
    } catch (error) {
        console.error("Cohere error:", error);
        return "";
    }
}

export default callCohere;
