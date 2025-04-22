
const UserModel = (name, username, email, password) => ({
    name,
    username,
    email,
    password,
    refreshToken:"",
    createdAt: new Date(),
})

export default UserModel
  