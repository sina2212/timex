const { log } = require('console');
const { resolve } = require('path');
const query = require(resolve('./db/query'));
const auth = require(resolve('./modules/base/aaa'));
const userSchema = require(resolve('./db/schema/general/users'));
const inOutSchema = require(resolve('./db/schema/general/in_out'));

module.exports = function (app) {
    app.post('/in', auth, async (req, res) => {
        try{
            const userId = req.user.user.id;
            const timeIn = req.body.time_in || undefined;
            const lat = req.body.lat || undefined;
            const lng = req.body.lng || undefined;
            
            if(!timeIn) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            
            const id = {id: userId};
            const exist_user = await userSchema.find_by_id(app, id);
            if (exist_user.length === 0) {
                return res.json({status: 'error', message: 'کاربر وجود ندارد'});
            }
            
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
            const userId = req.user.user.id;
            const lat = req.body.lat || undefined;
            const lng = req.body.lng || undefined;
            const timeOut = req.body.time_out || undefined;
            
            if(!timeOut) {
                return res.json({status: 'error', error_code: 901, message: 'زمان خروج الزامی است!'});
            }
            
            const activeCheckIn = await inOutSchema.get_active_checkin(app, {user_id: userId});
            if (activeCheckIn.length == 0) {
                return res.json({status: 'error', message: 'شما چک‌این فعالی ندارید. ابتدا چک‌این کنید.'});
            }
            
            const checkInRecord = activeCheckIn[0];
            const khorojValues = {
                lat: lat,
                lng: lng,
                id: checkInRecord.id,
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
            const username = req.user.user.username;
            
            if (username !== 'admin') {
                return res.json({status: 'error', message: 'دسترسی محدود - فقط ادمین'});
            }
            
            const result = await inOutSchema.show_all(app);
            if (result === false) {
                return res.json({status: 'error', message: 'خطا در دریافت اطلاعاتورود و خروج'});
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
            
            const result = await query.Select(app, 'general.attendance', ['user_id'], [userId]);
            if (result === false) {
                return res.json({status: 'error', message: 'خطا در دریافت اطلاعاتورود و خروج'});
            }
            
            return res.json({status: 'ok', attendance: result.rows});
            
        } catch(err) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: "خطای سرور"});
        }
    });

    app.delete('/attendance/:id', auth, async (req, res) => {
        try {
            const userId = req.user.user.id;
            const attendanceId = req.params.id;
            const username = req.user.user.username;
            
            if (!attendanceId || isNaN(attendanceId)) {
                return res.json({status: 'error', message: 'شناسهورود و خروج نامعتبر است'});
            }
            const attendanceRecord = await inOutSchema.select_attendance(app, {attendance_id: attendanceId});
            
            if (!attendanceRecord || attendanceRecord.length == 0) {
                return res.json({status: 'error', message: 'رکوردورود و خروج یافت نشد'});
            }
            
            const record = attendanceRecord[0];
            
            if (record.user_id !== userId && username !== 'admin') {
                return res.json({status: 'error', message: 'دسترسی غیرمجاز - شما فقط می‌توانید رکوردهای خود را حذف کنید'});
            }
            
            const result = await inOutSchema.delete_checkin(app, {attendance_id: attendanceId});
            if (result == false) {
                return res.json({status: 'error', message: 'خطا در حذف رکوردورود و خروج'});
            }
            
            return res.json({status: 'ok', message: 'رکوردورود و خروج با موفقیت حذف شد'});
            
        } catch(err) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: "خطای سرور"});
        }
    });

}