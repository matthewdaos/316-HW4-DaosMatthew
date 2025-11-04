const dotenv = require('dotenv')
dotenv.config();

const MongoDatabaseManager = require('./mongodb');
const PostgresDatabaseManager = require('./postgresql');
let dbManager;

switch(process.env.DB_TYPE) {
    case 'postgresql':
        dbManager = new PostgresDatabaseManager();
        break;
    case 'mongo':
    default: 
        dbManager = new MongoDatabaseManager();
        break;
}

module.exports = dbManager

