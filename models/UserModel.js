
const UserModel = (name, username, email, password) => ({
    name,
    username,
    email,
    password,
    refreshToken:null,
    createdAt: new Date().toISOString(),
})

export default UserModel
  