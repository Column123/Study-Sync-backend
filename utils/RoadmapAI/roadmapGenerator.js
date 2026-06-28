import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates an AI roadmap based on a list of topics and a total time limit.
 * @param {string} topics - A comma-separated string or paragraph of topics.
 * @param {string} totalTime - The total available time (e.g., "20 hours", "14 days").
 * @returns {Promise<Array>} - The parsed JSON array of roadmap nodes.
 */
const generateRoadmap = async (topics, totalTime) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    try {
        const roadmapSchema = {
            type: Type.ARRAY,
            description: "An array of topic nodes forming a learning roadmap.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "The title of the topic."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A short, 1-2 sentence description of what will be learned."
                    },
                    "id": {
                        type: Type.INTEGER,
                        description: "A unique integer ID for this node, starting at 1."
                    },
                    "previous_node": {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: "Array of node IDs that MUST be completed before starting this node. Empty array if it is a starting point."
                    },
                    "time_required": {
                        type: Type.NUMBER,
                        description: "Estimated time to complete this specific node in hours."
                    },
                    status: {
                        type: Type.BOOLEAN,
                        description: "Always initialize as false."
                    },
                    resources: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array of 1-2 relevant external URLs or search terms for studying."
                    },
                    difficulty: {
                        type: Type.STRING,
                        enum: ["easy", "medium", "hard"],
                        description: "The difficulty level of the topic."
                    },
                    "test_status": {
                        type: Type.BOOLEAN,
                        description: "Always initialize as false."
                    }
                },
                required: [
                    "title", "description", "id", "previous_node",
                    "time_required", "status", "resources", "difficulty", "test_status"
                ]
            }
        };

        const prompt = `
            You are an expert curriculum designer. 
            I need a study roadmap for the following topics: "${topics}".
            The maximum total time to complete ALL topics combined is: "${totalTime}".
           CRITICAL RULES:
            1. MATHEMATICS & TIME: Convert the total time into hours or minutes. Distribute this time across nodes. The total sum of node times MUST equal or be slightly less than the total input time. If the time is very short, assign very small time increments (e.g., 15 minutes) rather than merging topics.
            2. ZERO-MERGING POLICY (STRICT): Parse the input string by commas. UNDER NO CIRCUMSTANCES are you allowed to combine, group, or merge two comma-separated topics into a single node. Treat every comma as an unbreakable wall. Every single comma-separated item MUST have its own dedicated node(s).
            3. TOPIC DECOMPOSITION: If a comma-separated item is broad (e.g., "Node.js"), you must break it down into multiple separate nodes (e.g., "Node.js Setup", "Event Loop"). 
            4. GRAPH STRUCTURE & BRANCHING (CRITICAL): The roadmap MUST be structured as a complex Directed Acyclic Graph (DAG), NOT a simple straight line (1->2->3->4). You MUST create parallel learning paths where logically possible. For example, if Node 2 and Node 3 do not depend on each other but both require Node 1, they MUST BOTH have [1] in their "previous_node" array so they branch out side-by-side. 
            5. CONVERGENCE & MULTIPLE DEPENDENCIES: Branches must eventually reconnect. If an advanced topic requires knowledge from multiple parallel branches, you MUST include ALL of their IDs in the "previous_node" array (e.g., [2, 3]). A purely linear sequence will be treated as a failure.
            6. STARTING POINTS: Limit starting points (nodes with an empty [] "previous_node" array) to 2 or 4 maximum to act as the root(s) of the graph.
            7. STATUS SETTINGS: "status" and "test_status" must strictly be set to false for every node.
            8. DIFFICULTY: Provide highly realistic difficulty ratings.
            9. RESOURCES FORMAT: The "resources" array must contain ONLY real, valid URLs. Provide links to official documentation, highly regarded tutorials, or video links. Never provide general text like "Search YouTube for X". Every item must start with "https://".
            10. RESOURCE COUNT: There should be a minimum of 2 resources per node, but no more than 5.
            `;


        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',

            // model: "gemini-3.1-flash-lite-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: roadmapSchema,
                temperature: 0.2,
            }
        });

        const responseText = response.text;

        return JSON.parse(responseText);

    } catch (error) {
        const aiError = error?.cause?.error;


        if (aiError?.status === "UNAVAILABLE" || aiError?.code === 503) {
            console.warn("AI unavailable (503)");
            const err = new Error("AI service is currently unavailable due to high demand. Please try again shortly.");
            err.statusCode = 503;
            throw err;
        }


        if (aiError?.code === 429) {
            console.warn("AI rate limit hit (429)");
            const err = new Error("Too many requests to AI service. Please try again later.");
            err.statusCode = 429;
            throw err;
        }


        console.error("Unexpected error:", error);

        throw error;
    }
};

export default generateRoadmap;