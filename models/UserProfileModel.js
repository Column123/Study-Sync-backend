
const UserProfileModel = (userData) =>({
    username: userData.username,
    bio: userData.bio || null,

    currentEducationLevel: userData.currentEducationLevel || null,
    currentInstitution: userData.currentInstitution || null,
    major: userData.major || null,

    githubUrl: userData.githubUrl || null,
    linkedinUrl: userData.linkedinUrl || null,
    website: userData.website || null,

    reputationScore: 0,
    questionsAsked: 0,
    totalPath: 0,
    completedPath: 0,
})

export default UserProfileModel