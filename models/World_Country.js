const {DataTypes} = require('sequelize')
const db = require('../Database/database');

const WorldCountry = db.define('world_countries', {
    gid: {
        type: DataTypes.INTEGER,
    },
    name_long: {
        type: DataTypes.STRING,
      },
    sov_a3: {
        type: DataTypes.STRING,
      },
    geom: {
        type: DataTypes.GEOMETRY('POLYGON'), // or any other PostGIS geometry type you need
    }
    }
);

module.exports = WorldCountry;