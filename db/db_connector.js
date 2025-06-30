const { Client } = require('pg')

module.exports = async function(app)
{
    if (!app.CC.Config.PostgreSQL.DB_USER || 
        !app.CC.Config.PostgreSQL.PG_PASSWORD ||  
        !app.CC.Config.PostgreSQL.PG_HOST ||
        !app.CC.Config.PostgreSQL.PG_DBNAME ||
        !app.CC.Config.PostgreSQL.PG_PORT)
            return undefined;
    try {
        // Connecting PostgreSQL
        app.CC.Config.PostgreSQL.Client = undefined
        app.CC.Config.PostgreSQL.Client = new Client({
            user: app.CC.Config.PostgreSQL.DB_USER,
            password: app.CC.Config.PostgreSQL.PG_PASSWORD,
            host: app.CC.Config.PostgreSQL.PG_HOST,
            database: app.CC.Config.PostgreSQL.PG_DBNAME,
            port: app.CC.Config.PostgreSQL.PG_PORT
            })
        await app.CC.Config.PostgreSQL.Client.connect()
        console.log('PostgreSQL is connected!')
        return true
    } catch (err) {
        app.CC.Config.PostgreSQL.Client = undefined
        return undefined
    }
}