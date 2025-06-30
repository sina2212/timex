const express = require('express');
const resolve = require('path').resolve;

module.exports = function(app) 
{
    // Handling Statics
    app.use('/assets/jquery',    express.static(resolve('./node_modules/jquery/dist')))
}