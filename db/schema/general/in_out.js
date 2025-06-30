const resolve = require('path').resolve;
const query = require(resolve('./db/query'))

module.exports.show_all = async function (app) {
    try {
        const res = await query.Select(app, 'general.in_out');
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}