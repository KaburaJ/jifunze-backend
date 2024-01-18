const express = require('express')
const { registerUser, loginUser, logoutUser } = require('../controllers/authController')
const userRoutes = express.Router()

userRoutes.post('/user/signup', registerUser)
userRoutes.post('/user/login', loginUser)
userRoutes.get('/user/logout', logoutUser)

module.exports = userRoutes