const { Sequelize } = require('sequelize')
require('dotenv').config()
const db = new Sequelize("Arms_Registers", process.env.user, process.env.password, {
    host: process.env.host,
    dialect: process.env.dialect,
})

module.exports = db;