const jwt = require('jsonwebtoken');

module.exports = (req, res, next)=>{
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({error:"لطفا وارد شوید!"});
    }
    try {
        const decode = jwt.verify(token, 'jwt secret');
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({error:"توکن نامعتبر!"});
    }
}