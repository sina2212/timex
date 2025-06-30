const resolve = require('path').resolve;
module.exports = function(app)
{
    // These should come before other routes
    require(resolve('./modules/base/static'))(app);
    require(resolve('./modules/operations/users'))(app);
    // require(resolve('./modules/operations/login'))(app);
}