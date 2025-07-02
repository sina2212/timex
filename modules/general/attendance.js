const { resolve } = require('path');
const userSchema = require(resolve('./db/schema/general/users'));
const auth = require(resolve('../base/aaa'));
const inOutSchema = require(resolve('./db/schema/general/in_out'));

module.exports = function (app) {
    app.post('/in', auth, async (req, res) => {
        try{
            const userId = req.user.id || undefined;
            const timeIn = req.body.time_in || undefined;
            const lat = req.body.lat || undefined;
            const lng = req.body.lng || undefined;
            if(!userId || !timeIn) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            const hozorValues = {
                user_id: userId,
                time_in: timeIn,
                lat: lat,
                lng: lng,
            }
            const id = {id: hozorValues.user_id};
            const exist_user = await userSchema.find_by_id(app, id);
            if (exist_user.length = 0) {
                return res.json({status: 'error', message: 'کاربر وجود ندارد'});
            }
            const result = await inOutSchema.get_inside(app, hozorValues);
            if (result.length == 0 || result == false) {
                return res.json({status: 'error', message: 'دوباره سعی کنید', id: -1});
            }
            else{
                return res.json({status: 'ok', message: 'تایید شد'});
            }
            
        } catch(err) {
            if (err["code"] === '23505') {
                return res.json({status: 'error', message: '23505', id: -1});
            }
            else {
                log(err);
                return res.json({status: 'error', error_code: err["code"], message: ""});
            }
        }
    });

    app.post('/out', auth,async (req, res) => {
        try{
            const lat = req.body.lat || undefined;
            const lng = req.body.lng || undefined;
            const outId = req.body.id || undefined;
            const timeOut = req.body.time_out || undefined;
            if(!timeOut) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            const khorojValues = {
                lat: lat,
                lng: lng,
                id: outId,
                time_out: timeOut,
            }
            const result = await inOutSchema.get_outside(app, khorojValues);
            if (result.length == 0 || result == false) {
                return res.json({status: 'error', message: 'دوباره سعی کنید', id: -1});
            }
            else{
                return res.json({status: 'ok', message: 'تایید شد'});
            }
        } catch(err) {
            if (err["code"] === '23505') {
                return res.json({status: 'error', message: '23505', id: -1});
            }
            else {
                log(err);
                return res.json({status: 'error', error_code: err["code"], message: ""});
            }
        }
    });
}