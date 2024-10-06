const {DataTypes} = require('sequelize')
const db = require('../Database/database');

const Armament_Categories = db.define('Armament_Categories', {
    description: {
        type: DataTypes.STRING,
        primaryKey: true
      },
    armament_category: {
        type: DataTypes.STRING,
      },
    },
    {
        timestamps: false,
        tableName: 'Armament_Categories'
    }
);

module.exports = Armament_Categories;