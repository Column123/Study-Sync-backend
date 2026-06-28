import { FieldValue } from 'firebase-admin/firestore';

const RoadmapModel = (title, topics, roadmap, totalModules, percentageCompleted, userId) => ({
    title,
    topics,
    totalModules,
    percentageCompleted,
    userId,
    roadmap,
    createdAt: FieldValue.serverTimestamp()
})

export default RoadmapModel;