const { resolve } = require('path');
const { log } = require('console');
const userSchema = require(resolve('./db/schema/general/users'));
const auth = require(resolve('./modules/base/aaa'));
const inOutSchema = require(resolve('./db/schema/general/in_out'));

module.exports = function (app) {
    app.CC.Security = {};
    app.CC.Security.Authenticating = async function (req, res, next) {
        const token = req.headers.cookie.replace('token=', '');
        if (!token) {
            return res.status(401).json({error:"لطفا وارد شوید!"});
        }
        try {
            const decode = jwt.verify(token, app.CC.Config.Security.WEB_ACCESS_TOKEN_SECRET);
            // console.log(decode);
            req.user = decode;
            next();
        } catch (error) {
            return res.status(401).json({error:"توکن نامعتبر!"});
        }
    }
    app.post('/in', app.CC.Security.Authenticating, async (req, res) => {
        try{
            const userId = req.user.user.id; // Fixed: Get userId from JWT token correctly
            const timeIn = req.body.time_in || undefined;
            const lat = req.body.lat || undefined;
            const lng = req.body.lng || undefined;
            
            if(!timeIn) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            
            // Validate user exists
            const id = {id: userId};
            const exist_user = await userSchema.find_by_id(app, id);
            if (exist_user.length === 0) { // Fixed: Use comparison instead of assignment
                return res.json({status: 'error', message: 'کاربر وجود ندارد'});
            }
            
            // Check if user already has an active check-in (no check-out time)
            const activeCheckIn = await inOutSchema.get_active_checkin(app, {user_id: userId});
            if (activeCheckIn && activeCheckIn.length > 0) {
                return res.json({status: 'error', message: 'شما قبلاً چک‌این کرده‌اید. ابتدا چک‌اوت کنید.'});
            }
            
            const hozorValues = {
                user_id: userId,
                time_in: timeIn,
                lat: lat,
                lng: lng,
            }
            
            const result = await inOutSchema.get_inside(app, hozorValues);
            if (result.length === 0 || result === false) {
                return res.json({status: 'error', message: 'خطا در ثبت ورود. دوباره سعی کنید', id: -1});
            }
            else{
                return res.json({status: 'ok', message: 'ورود با موفقیت ثبت شد', check_in_id: result[0].id});
            }
            
        } catch(err) {
            if (err["code"] === '23505') {
                return res.json({status: 'error', message: 'رکورد تکراری', id: -1});
            }
            else {
                log(err);
                return res.json({status: 'error', error_code: err["code"], message: "خطای سرور"});
            }
        }
    });

    app.post('/out', auth, async (req, res) => {
        try{
            const userId = req.user.user.id; // Fixed: Get userId from JWT token correctly
            const lat = req.body.lat || undefined;
            const lng = req.body.lng || undefined;
            const timeOut = req.body.time_out || undefined;
            
            if(!timeOut) {
                return res.json({status: 'error', error_code: 901, message: 'زمان خروج الزامی است!'});
            }
            
            // Find user's active check-in record (without check-out time)
            const activeCheckIn = await inOutSchema.get_active_checkin(app, {user_id: userId});
            if (activeCheckIn.length == 0) {
                return res.json({status: 'error', message: 'شما چک‌این فعالی ندارید. ابتدا چک‌این کنید.'});
            }
            
            const checkInRecord = activeCheckIn[0];
            const khorojValues = {
                lat: lat,
                lng: lng,
                id: checkInRecord.id, // Use the active check-in record ID
                time_out: timeOut,
            }
            
            const result = await inOutSchema.get_outside(app, khorojValues);
            if (result.length === 0 || result === false) {
                return res.json({status: 'error', message: 'خطا در ثبت خروج. دوباره سعی کنید', id: -1});
            }
            else{
                return res.json({
                    status: 'ok', 
                    message: 'خروج با موفقیت ثبت شد',
                    check_in_time: checkInRecord.time_in,
                    check_out_time: timeOut
                });
            }
        } catch(err) {
            if (err["code"] === '23505') {
                return res.json({status: 'error', message: 'رکورد تکراری', id: -1});
            }
            else {
                log(err);
                return res.json({status: 'error', error_code: err["code"], message: "خطای سرور"});
            }
        }
    });

    app.get('/attendance', auth, async (req, res) => {
        try {
            const userId = req.user.user.id;
            const username = req.user.user.username;
            
            // Check if user is admin
            if (username !== 'admin') {
                return res.json({status: 'error', message: 'دسترسی محدود - فقط ادمین'});
            }
            
            const result = await inOutSchema.show_all(app);
            if (result === false) {
                return res.json({status: 'error', message: 'خطا در دریافت اطلاعات حضور و غیاب'});
            }
            
            return res.json({status: 'ok', attendance: result});
            
        } catch(err) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: "خطای سرور"});
        }
    });

    app.get('/my-attendance', auth, async (req, res) => {
        try {
            const userId = req.user.user.id;
            
            // Get user's own attendance records
            const userSchema = require(resolve('./db/schema/general/users'));
            const query = require(resolve('./db/query'));
            
            const result = await query.Select(app, 'general.attendance', ['user_id'], [userId]);
            if (result === false) {
                return res.json({status: 'error', message: 'خطا در دریافت اطلاعات حضور و غیاب'});
            }
            
            return res.json({status: 'ok', attendance: result.rows});
            
        } catch(err) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: "خطای سرور"});
        }
    });
}