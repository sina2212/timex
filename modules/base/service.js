const resolve = require('path').resolve;

module.exports.runTimex = async function () { 
    // Initialized app
    app = await require(resolve('./modules/base/app'))();
    // Running Web Service
    app.listen(app.CC.Config.WebInterface.PORT, () => {
        console.log(`CC Web Interface is now running on ${app.CC.Config.WebInterface.URL }`);
    })
}