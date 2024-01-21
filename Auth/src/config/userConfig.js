require('dotenv').config();

const connectionString = `Server=tcp:${process.env.DB_SERVER},1433;Initial Catalog=${process.env.DB_NAME};Persist Security Info=False;User ID=${process.env.DB_USER};Password=${process.env.DB_PWD};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;

const config = {
    connectionString: connectionString,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, 
        trustServerCertificate: false 
    }
};

module.exports = config;
