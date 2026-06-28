import generateRoadmap from "../../utils/RoadmapAI/roadmapGenerator.js";
import RoadmapModel from "../../models/RoadMapModel.js";
import { db, Roadmaps } from "../../config/firebaseConfig.js";
import { userProfiles } from "../../config/firebaseConfig.js";
import { FieldValue } from 'firebase-admin/firestore';

const createRoadmap = async (req, res)=>{
    try{
        const {topics, time} = req.body;
        if(!topics || !time){
            return res.status(400).json({message: "topics and time are required"});
        }
        const roadmap = await generateRoadmap(topics, time);
        return res.status(200).json({roadmap});
    }
    catch(err){
        console.error("Error in createRoadmap:", err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

const saveRoadmap = async (req, res)=>{
    try{
        const userId = req.user.id;
        const {title,roadmap,topics} = req.body;
        if (!title ||!topics || !roadmap || !Array.isArray(roadmap)) {
            return res.status(400).json({ message: "Invalid roadmap data" });
        }
        const totalModules = roadmap.length;
        const percentageCompleted = 0;
        const newRoadmap = RoadmapModel(title, topics, roadmap, totalModules, percentageCompleted, userId);

        const roadmapRef = Roadmaps.doc();
        const userProfileRef = userProfiles.doc(userId);
        
        const batch = db.batch();
        batch.set(roadmapRef, newRoadmap);
        batch.update(userProfileRef, {
            totalPath: FieldValue.increment(1)
        });
        await batch.commit();
        return res.status(201).json({ 
            message: "Roadmap saved successfully",
            roadmapId: roadmapRef.id 
        });
    }catch(err){
        console.error("Error in saveRoadmap:", err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

const getRoadmap = async (req, res)=>{
    try{
        const userId = req.user.id;
        const roadmapId = req.params.roadmapId;
        if(!roadmapId){
            return res.status(400).json({message: "roadmapId is required"});
        }
        const roadmapSnapshot = await Roadmaps.doc(roadmapId).get();
        if(!roadmapSnapshot.exists){
            return res.status(404).json({message: "Roadmap not found"});
        }
        const roadmapData = roadmapSnapshot.data();
        if (roadmapData.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized to update this roadmap" });
        }
        return res.status(200).json({roadmapData: roadmapData});
    }
    catch(err){
        console.error("Error in getRoadmaps:", err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

const getUserRoadmaps = async (req, res) => {
    try{
        const userId = req.user.id;
        const roadmap_ref = Roadmaps.where("userId", "==", userId);
        const userProfileRef = userProfiles.doc(userId);
        const [roadmapSnapshot, userProfileSnapshot] = await Promise.all([
            roadmap_ref.get(),
            userProfileRef.get()
        ]);

        let totalPath = 0;
        let completedPath = 0;
        
        if(userProfileSnapshot.exists){
            const profileData = userProfileSnapshot.data();
            totalPath = profileData.totalPath || 0;
            completedPath = profileData.completedPath || 0;
        }

        const roadmapsList = [];
        if(!roadmapSnapshot.empty){
            roadmapSnapshot.forEach(doc => {
                const data = doc.data();
                roadmapsList.push({
                    roadmapId: doc.id,
                    title: data.title,
                    topics: data.topics,
                    totalModules: data.totalModules,
                    percentageCompleted: data.percentageCompleted,
                });
            });
        }

        return res.status(200).json({
            stats:{
                totalPath: totalPath,
                completedPath: completedPath
            },
            roadmaps: roadmapsList
        })

    }catch(err){
        console.error("Error in getUserRoadmaps:", err);
        res.status(500).json({message: "Internal Server Error"});
    }
}


const updateRoadmapProgress = async (req, res) => {
    try{
        const userId = req.user.id;
        const roadmapId = req.params.roadmapId;
        const {nodeId} = req.body;
        if(!roadmapId || !nodeId){    
            return res.status(400).json({message: "roadmapId and nodeID are required"});
        }
        const roadmapRef = Roadmaps.doc(roadmapId);
        const roadmapSnapshot = await roadmapRef.get();
        if(!roadmapSnapshot.exists){
            return res.status(404).json({message: "Roadmap not found"});
        }
        const roadmapData = roadmapSnapshot.data();
        if (roadmapData.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized to update this roadmap" });
        }
        const roadmap = roadmapData.roadmap;
        const targetNodeId = parseInt(nodeId);
        const nodeIndex = roadmap.findIndex(node => node.id === targetNodeId);
        if (nodeIndex === -1) {
            return res.status(404).json({ message: "Invalid nodeId" });
        }
        
        if (roadmap[nodeIndex].status) {
            return res.status(400).json({ message: "Node already completed" });
        }
        const previousNodes = roadmap[nodeIndex]["previous_node"] || [];
        for (const prevId of previousNodes) {
            const reqNode = roadmap.find(n => n["id"] === prevId);
            
            if (reqNode && reqNode.status === false) {
                return res.status(400).json({ 
                    message: `Cannot unlock. You must complete '${reqNode.title}' first.` 
                });
            }
        }
        roadmap[nodeIndex].status = true;
        const totalModules = roadmapData.totalModules;
        const completedModules = roadmap.filter(node => node.status === true).length;
        const newPercentage = Math.round((completedModules / totalModules) * 100);

        if(newPercentage === 100 && roadmapData.percentageCompleted !== 100){
            const batch = db.batch();
            batch.update(roadmapRef,{
                    roadmap: roadmap,
                    percentageCompleted: newPercentage
            });
            batch.update(userProfiles.doc(userId), {
                completedPath: FieldValue.increment(1)
            });
            await batch.commit();
        }
        else{
            await roadmapRef.update({
                roadmap: roadmap,
                percentageCompleted: newPercentage
            });
        }
        return res.status(200).json({
            message: "Roadmap progress updated successfully",
            percentageCompleted: newPercentage,
            updatedNode: targetNodeId
        });
    }
    catch(err){
        console.error("Error in updateRoadmapProgress:", err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export default {createRoadmap, saveRoadmap, getRoadmap, updateRoadmapProgress, getUserRoadmaps};