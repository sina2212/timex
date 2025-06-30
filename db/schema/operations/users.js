const resolve = require('path').resolve;
const query = require(resolve('./db/query'))

module.exports.show_all = async function (app) {
    try {
        const res = await query.Select(app, 'general.users');
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.check_unique = async function (app, values) {
    try {
        const res = await query.Select(app, 'general.users', ['username'], [values.username])
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.save_new_user = async function (app, values) {
    try {
        const res = await query.Insert(app, 'general.users',
            ['full_name', 'username', 'password', 'phone_number'],
            [values.full_name, values.username, values.password, values.phone_number]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.change_information = async function (app, values) {
    try {
        const res = await query.Update(app, 'general.users',
            ['username', 'phone_number'], [values.username, values.phone_number],
            ['id'], [values.id]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.change_password = async function (app, values) {
    try {
        const res = await query.Update(app, 'general.users',
            ['password'], [values.password],
            ['id'], [values.id]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.login = async function (app, values) {
    try {
        const res = await query.Select(app, 'general.users',
            ['username'], [values.username]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.find_by_id = async function (app, values) {
    try {
        const res = await query.Select(app, 'general.users',
            ['id'], [values.id]
        );
        return res.rows;
    } catch (error) {
        console.log(error);
        return false;
    }
}