const LikedUserModel = (user_id) =>({
    user_id,
    likedAt: new Date(),
})

export default LikedUserModel