const resolve = require('path').resolve;
const query = require(resolve('./db/query'))

module.exports.show_all = async function (app) {
    try {
        const res = await query.Select(app, 'general.attendance');
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

//TODO: Show all attendance records for all user's

module.exports.get_inside = async function (app, values) {
    try {
        const res = await query.Insert(app, 'general.attendance',
            ['user_id', 'time_in', 'lat', 'lng'],
            [values.user_id, values.time_in, values.lat, values.lng]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.get_outside = async function (app, values) {
    try {
        const res = await query.Update(app, 'general.attendance',
            ['time_out', 'lat', 'lng'],
            [values.time_out, values.lat, values.lng],
            ['id'], [values.id]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}