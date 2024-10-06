const express = require("express");
const app = express();
const db = require('./Database/database.js')
const cors = require('cors')
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');


const adminClient = new Client({
    user: process.env.user,
    host: process.env.host,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port,
  });

  const postgresClient = new Client({
    user: process.env.user,
    host: process.env.host,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port,
  });

  const client = new Client({
    user: process.env.user,
    host: process.env.host,
    password: process.env.password,
    database: 'Arms_Registers',
    port: process.env.port,
  });

  const checkDatabaseExists = async (dbName) => {
    try {
      await adminClient.connect();
      
      const query = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const res = await adminClient.query(query, [dbName]);
      if (res.rows.length > 0) {
        console.log(`Database "${dbName}" already exists.`);
        return true; // Database exists
      } else {
        console.log(`Database "${dbName}" does not exist.`);
        return false; // Database does not exist
      }
    } catch (error) {
      console.error('Error checking database existence:', error);
    } finally {
      await adminClient.end();
    }
  };
  
  const createDatabaseAndTables = async (dbName) => {
    try{ 
        await postgresClient.connect();
        //console.log('Connected to postgres database');
        const dbCreationQuery = `CREATE DATABASE "${dbName}";`;
        await postgresClient.query(dbCreationQuery);
        //console.log('Database created successfully!');
        await postgresClient.end();
        await client.connect();
        await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        //console.log('Connected to Arms_Registers_')
        const createSequenceQuery = `
        CREATE SEQUENCE IF NOT EXISTS ne_110m_admin_0_countries_gid_seq
        AS integer
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
      `;
      await client.query(createSequenceQuery);
        const createWorldCountryTable = `
            CREATE TABLE IF NOT EXISTS public.world_countries
(
gid integer NOT NULL DEFAULT nextval('ne_110m_admin_0_countries_gid_seq'::regclass),
sov_a3 character varying(3) COLLATE pg_catalog."default",
name_long character varying(35) COLLATE pg_catalog."default",
geom geometry(MultiPolygon,4326),
CONSTRAINT ne_110m_admin_0_countries_pkey PRIMARY KEY (gid)
);
          `;
          const createGeneralTradeRegisterTable = `
          CREATE TABLE IF NOT EXISTS public."GeneralTradeRegister"
          (
recipient character varying(128) COLLATE pg_catalog."default",
supplier character varying(128) COLLATE pg_catalog."default",
order_year character varying(4) COLLATE pg_catalog."default",
order_year_estimate character varying(1) COLLATE pg_catalog."default",
numbers_ordered character varying(16) COLLATE pg_catalog."default",
numbers_ordered_estimate character varying(1) COLLATE pg_catalog."default",
designation character varying(128) COLLATE pg_catalog."default",
description character varying(256) COLLATE pg_catalog."default",
numbers_delivered character varying(16) COLLATE pg_catalog."default",
numbers_delivered_estimate character varying(1) COLLATE pg_catalog."default",
delivery_year_s character varying(256) COLLATE pg_catalog."default",
status character varying(128) COLLATE pg_catalog."default",
comments character varying(1024) COLLATE pg_catalog."default",
tiv_per_unit double precision,
tiv_total_order double precision,
tiv_delivered_weapons double precision,
id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
CONSTRAINT "GeneralTradeRegister_pkey" PRIMARY KEY (id)
);
          `;
          const createArmamentCategoriesTable = `
              CREATE TABLE IF NOT EXISTS public."Armament_Categories"
(
description character varying(256) COLLATE pg_catalog."default" NOT NULL,
armament_category character varying(256) COLLATE pg_catalog."default",
CONSTRAINT description PRIMARY KEY (description)
);
          `;
    await client.query(createWorldCountryTable);
    await client.query(createGeneralTradeRegisterTable);
    await client.query(createArmamentCategoriesTable);

    } catch (error) {
        console.error('Error creating the database:', error);     
    } finally {
        await client.end();
    }
  }

const insertDataFromCSV = async (client) => {
  return new Promise((resolve, reject) => {
    const promises = []; // To collect all query promises

    const processTradeRegisterCSV = new Promise((resolve, reject) => {
      fs.createReadStream('./csv_files/general_trade_register.csv')
      .pipe(csv({
        headers: [
          'recipient', 'supplier', 'order_year', 'order_year_estimate', 'numbers_ordered',
          'numbers_ordered_estimate', 'designation', 'description', 'numbers_delivered',
          'numbers_delivered_estimate', 'delivery_year_s', 'status', 'comments',
          'tiv_per_unit', 'tiv_total_order', 'tiv_delivered_weapons'
        ],
        skipEmptyLines: true,
      }))
      .on('data', (row) => {
            const {
            recipient,
            supplier,
            order_year,
            order_year_estimate,
            numbers_ordered,
            numbers_ordered_estimate,
            designation,
            description,
            numbers_delivered,
            numbers_delivered_estimate,
            delivery_year_s,
            status,
            comments,
            tiv_per_unit,
            tiv_total_order,
            tiv_delivered_weapons,
          } = row;
          //console.log(row);
          const trade_registers_query = `
            INSERT INTO public."GeneralTradeRegister" 
              (recipient, supplier, order_year, order_year_estimate, numbers_ordered, numbers_ordered_estimate, designation, description, numbers_delivered, numbers_delivered_estimate, delivery_year_s, status, comments, tiv_per_unit, tiv_total_order, tiv_delivered_weapons)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
          `;

          promises.push(client.query(trade_registers_query, [
            recipient,
            supplier,
            order_year,
            order_year_estimate,
            numbers_ordered,
            numbers_ordered_estimate,
            designation,
            description,
            numbers_delivered,
            numbers_delivered_estimate,
            delivery_year_s,
            status,
            comments,
            tiv_per_unit,
            tiv_total_order,
            tiv_delivered_weapons,
          ]));
    })
    .on('end', resolve)
    .on('error', reject);
    });

    const processArmamentCategoriesCSV = new Promise((resolve, reject) => {
      fs.createReadStream('./csv_files/armament_categories.csv')
        .pipe(csv({
          headers: ['description', 'armament_category'],
          skipEmptyLines: true,
        }))
        .on('data', (row) => {
          const { description, armament_category } = row;

          const armament_category_query = `
            INSERT INTO public."Armament_Categories"
              (description, armament_category)
            VALUES ($1, $2);
          `;

          promises.push(client.query(armament_category_query, [
            description, armament_category
          ]));
        })
        .on('end', resolve)
        .on('error', reject);
    });

  const processWorldCountriesCSV = new Promise((resolve, reject) => {
  fs.createReadStream('./csv_files/world_countries.csv')
    .pipe(csv({
      headers: [
        'gid', 'sov_a3', 'name_long', 'geom'
      ]
    }))
    .on('data', async (row) => {
      const {
        gid,
        sov_a3,
        name_long,
        geom
      } = row;

      const world_country_query = `
            INSERT INTO public."world_countries"
            (gid, sov_a3, name_long, geom) 
            VALUES ($1, $2, $3, $4)
        `;
      promises.push(client.query(world_country_query, [
        gid,
        sov_a3,
        name_long,
        geom
      ]));
    })
    .on('end', resolve)
    .on('error', reject);
    });

    Promise.all([processTradeRegisterCSV, processArmamentCategoriesCSV, processWorldCountriesCSV])
    .then(async () =>{
      await Promise.all(promises);
      console.log('All CSV files processed successfully.');
      resolve();
    })
    .catch((error) =>{
      console.error('Error processing CSV files:', error);
      reject(error);
    })
  })}

const main = async () => {
    const exist = await checkDatabaseExists('Arms_Registers');
    if(!exist){
          await createDatabaseAndTables('Arms_Registers');
              
          const csvTradeClient = new Client({
            user: process.env.user,
            host: process.env.host,
            password: process.env.password,
            database: 'Arms_Registers',
            port: process.env.port,
          });
          
          try {
            await csvTradeClient.connect();
            await insertDataFromCSV(csvTradeClient); // Use the correct client here
            await csvTradeClient.end();
            console.log("Closing csvTradeClient");
          } catch (error) {
            console.error('Error processing CSVs:', error);
          }
      } 
  db.authenticate()
      .then(function (err) {
          console.log('Connection has been established successfully.');
      }, function (err) {
          console.log('Unable to connect to the database:', err);
      });
  
  app.use(cors({
      origin: "http://localhost:3000",
  }))
  app.use(express.json());
  
  app.use('/USA', require('./routes/usa.js'));
  
  app.listen(3006, () => {
      console.log("server running");
  });
}

main().catch(err => console.error('Error in main function:', err));