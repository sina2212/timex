const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers.cookie.replace('token=', '');
    if (!token) {
        return res.status(401).json({error:"لطفا وارد شوید!"});
    }
    try {
        const decode = jwt.verify(token, app.CC.Config.Security.WEB_ACCESS_TOKEN_SECRET);
        console.log(decode);
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({error:"توکن نامعتبر!"});
    }
}