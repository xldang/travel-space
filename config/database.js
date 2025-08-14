const { Sequelize } = require('sequelize');
const path = require('path');

// Use /tmp directory for the database in Vercel environment
const storagePath = process.env.VERCEL ? path.join('/tmp', 'travel_blog_node.db') : 'travel_blog_node.db';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
});

module.exports = { sequelize };