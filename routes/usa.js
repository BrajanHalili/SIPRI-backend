const express = require('express');
const router = express.Router();
const WorldCountry = require('../models/World_Country');
const db = require('../Database/database')
const TradeRecord = require('../models/Trade_Register');
const Armament_Categories = require('../models/Armament_Category');
const { Op, Sequelize } = require('sequelize');

TradeRecord.belongsTo(Armament_Categories, {foreignKey: 'description'});
Armament_Categories.hasMany(TradeRecord, {foreignKey: 'description'});

router.get('/', async (req, res) => {
    try {
        const countries = await WorldCountry.findAll({
            attributes: [
              'gid',
              'name_long',
              'sov_a3',
              [db.fn('ST_AsGeoJSON', db.col('geom')), 'geojson'] // Convert geometry to GeoJSON
            ],
            where: {
              [Op.and] : [
                db.where(db.fn('ST_IsValid', db.col('geom')), true), // Filter valid geometries
                {name_long :{
                  [Op.ne] : 'United States'
                  }
                }
              ]
            }
      });
      //console.log(countries);
      const geoJson = {
        type: 'FeatureCollection',
        features: countries.map(country => ({
          type: 'Feature',
          geometry: JSON.parse(country.get('geojson')),
          properties: {
            id: country.gid,
            country_code: country.sov_a3,
            name_long: country.name_long,
          }
        }))
      };
      res.send(geoJson);
    }
        catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching GIS data' });
        }
    });

    router.get('/:country/:category', async (req, res) => {
      try {
        if(req.params.category == "All"){
          let TradeRecords = await TradeRecord.findAll({
            where: {
              recipient: req.params.country,
              supplier: 'United States',
            }, 
            include: [
            {
              model: Armament_Categories,
              attributes: ['armament_category']
            }
            ],
            order: [
              ['order_year', 'DESC'],
              ['Armament_Category', 'armament_category', 'ASC'],
            ],
          })
          TradeRecords.forEach(trade => {
            if(trade.order_year_estimate == '?'){
                trade.order_year += '?';
            }
            if(trade.numbers_ordered_estimate == '?'){
              trade.numbers_ordered += '?';
            }
            if(trade.numbers_delivered_estimate == '?'){
              trade.numbers_delivered += '?';
            }
          });
          res.send(TradeRecords);
        }
        else{
          let TradeRecords = await TradeRecord.findAll({
            include: [
              {
                model: Armament_Categories,
                attributes: ['armament_category']
              }
            ],
              where: {
                  [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.col('Armament_Category.armament_category'), {
                      [Sequelize.Op.eq]: req.params.category
                    }),
                    {
                      recipient: req.params.country,
                      supplier: 'United States',
                    }
                  ]
            }, 
            order: [
              ['order_year', 'DESC'],
            ],
          })
          TradeRecords.forEach(trade => {
            if(trade.order_year_estimate == '?'){
                trade.order_year += '?';
            }
            if(trade.numbers_ordered_estimate == '?'){
              trade.numbers_ordered += '?';
            }
            if(trade.numbers_delivered_estimate == '?'){
              trade.numbers_delivered += '?';
            }
          });
          //console.log(TradeRecords);
          res.send(TradeRecords);
        }
      }
      catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching trade registers' });
        }
    });

    router.get('/:country', async (req, res) => {
      try {
        const CategoryNumbers = await TradeRecord.findAll({
          attributes:[
            [Sequelize.col('Armament_Category.armament_category'), 'armament_category'],
            [Sequelize.fn('COUNT', Sequelize.col('Armament_Category.armament_category')), 'weapon_count'],
          ],
          include: [{
            model: Armament_Categories,
            attributes: []
          }],
          group: [
            ['Armament_Category.armament_category']
          ],
          where:[{
            recipient: req.params.country,
            supplier: 'United States'
          }],
          order: [
            ['armament_category', 'ASC']
          ]
        })

        res.send(CategoryNumbers);
      }
      catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetch armament numbers' });
      }
    });

module.exports = router;