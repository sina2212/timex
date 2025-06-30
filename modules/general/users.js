const { resolve } = require('path')
const jwt = require('jsonwebtoken');
const { json } = require('body-parser');
const crypto = require('crypto')
const bcrypt = require('bcrypt');
const { log } = require('console');
const parseCookies = require(resolve('./lib/parseCookies'))
const userSchema = require(resolve('./db/schema/general/users'))

module.exports = function (app) {
    app.post('/register', async (req, res) => {
        try{
            const fullName = req.body.full_name;
            const userName = req.body.username;
            const passwordText = req.body.password;
            const phoneNumber = req.body.phone_number;
            if(!fullName || !userName || !passwordText) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            const password = await bcrypt.hash(passwordText, app.CC.Config.Security.HASH_DIFFICULTY);
            
            const userValues = {
                username: userName,
                password: password,
                full_name: fullName,
                phone_number: phoneNumber,
            }
            const exist_user = await userSchema.check_unique(app, userValues);
            if (exist_user.length > 0) {
                return res.json({status: 'error', message: 'کاربر وجود دارد'});
            }
            const new_user = await userSchema.save_new_user(app, userValues);
            if (new_user.length == 0 || new_user == false) {
                return res.json({status: 'error', message: 'خطایی در هنگام ثبت کاربر رخ داده', id: -1});
            }
            else{
                return res.json({status: 'ok', message: 'کاربر ایجاد شد، لاگین کنید'});
            }
            
        } catch(err) {
            if (err["code"] === '23505') {
                return res.json({status: 'error', message: 'این شخص بعنوان کاربر ثبت شده', id: -1});
            }
            else {
                log(err);
                return res.json({status: 'error', error_code: err["code"], message: ""});
            }
        }
    });
    app.post('/login', async (req, res) => {
        try {
            const username = req.body.username || undefined
            const plainTextPassword = req.body.password || undefined
            if (!username || !plainTextPassword) {
                return res.json({status: 'error', error_code: 900, message: 'نام کاربری و رمز عبور را وارد کنید'})
            }
            user_values = {
                username: username,
                id: -1,
                full_name: '',
                phone_number: '',
            }
            // Find Users
            const user = await userSchema.login(app, user_values);
            if (user.length>0) {
                // Find User information
                user_values.id = user[0].id;
                const userEntity = await userSchema.find_by_id(app, user_values);
                const result = await bcrypt.compare(plainTextPassword, userEntity[0].password);
                if (result == false) {
                    return res.json({status: 'error', error_code: 901, message: 'رمزعبور نامعتبر است'});
                }
                if (result == true) {
                    user_values.full_name = userEntity[0].full_name;
                    user_values.phone_number = userEntity[0].phone_number;
                    return res.json({status: 'ok', message: user_values});
                }
            }
            else {
                return res.json({status: 'error', error_code: 901, message: 'نام کاربری نامعتبر است!'});
            }
        } catch (err) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: ""});
        }
    });
    app.get('/users', async (req, res) => {
        try {
            const users = await userSchema.show_all(app);
            return res.json({status: 'ok', users: users,});
        } catch (err) { 
            log(err)
        }
    });
    app.patch('/users', async(req, res)=>{
        try {
            const userId = req.body.id;
            const userName = req.body.username;
            const phoneNumber = req.body.phone_number;
            if (!phoneNumber || !userId || !userName) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            const infoValues ={
                id: userId,
                username: userName,
                phone_number: phoneNumber,
            }
            const change = await userSchema.change_information(app, infoValues);
            if (change.length == 0 || change == false) {
                return res.json({status: 'error', message: 'خطایی در هنگام ثبت کاربر رخ داده', id: -1});
            }
            else{
                return res.json({status: 'OK', message:'ویرایش با نموفقیت انجام شد'});
            }
        } catch (error) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: ""});
        }
    });
    app.put('/users', async(req, res)=>{
        try {
            const passwordText = req.body.password;
            const userId = req.body.id;
            if (!passwordText || !userId) {
                return res.json({status: 'error', error_code: 901, message: 'فیلد های مورد نظر را کامل کنید!'});
            }
            const password = await bcrypt.hash(passwordText, app.CC.Config.Security.HASH_DIFFICULTY);
            const infoValues ={
                id: userId,
                password: password,
            }
            const change_password = await userSchema.change_password(app, infoValues);
            if (change_password.length == 0) {
                return res.json({status: 'error', message: 'خطایی در هنگام ثبت کاربر رخ داده', id: -1});
            }
            else{
                return res.json({status: 'OK', message:'ویرایش با نموفقیت انجام شد'});
            }
        } catch (error) {
            log(err);
            return res.json({status: 'error', error_code: err["code"], message: ""});
        }
    });
}