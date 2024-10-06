const {DataTypes} = require('sequelize')
const db = require('../Database/database');

const TradeRecord = db.define('GeneralTradeRegister', {
    recipient: {
        type: DataTypes.STRING,
    },
    supplier: {
        type: DataTypes.STRING,
    },
    order_year: {
        type: DataTypes.INTEGER
    },
    order_year_estimate: {
        type: DataTypes.STRING,
    },
    numbers_ordered: {
        type: DataTypes.INTEGER,
    },
    numbers_ordered_estimate: {
        type: DataTypes.STRING,
    },
    designation: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.STRING,
    },
    numbers_delivered: {
        type: DataTypes.INTEGER,
    },
    numbers_delivered_estimate: {
        type: DataTypes.STRING,
    },
    delivery_year_s: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.STRING,
    },
    comments: {
        type: DataTypes.STRING,
    },
    tiv_per_unit: {
        type: DataTypes.DOUBLE,
    },
    tiv_total_order: {
        type: DataTypes.DOUBLE,
    },
    tiv_delivered_weapons: {
        type: DataTypes.DOUBLE,
    },
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    },
    {
        timestamps: false,
        tableName: 'GeneralTradeRegister'
    }
);

module.exports = TradeRecord;