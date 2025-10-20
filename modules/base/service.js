const resolve = require('path').resolve;

module.exports.runTimex = async function () { 
    // Initialized app
    app = await require(resolve('./modules/base/app'))();

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:8000'); // آدرس frontend
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200); // برای درخواست‌های preflight
        }
        next();
    });
    // Running Web Service
    app.listen(app.CC.Config.WebInterface.PORT, () => {
        console.log(`CC Web Interface is now running on ${app.CC.Config.WebInterface.URL }`);
    })
}