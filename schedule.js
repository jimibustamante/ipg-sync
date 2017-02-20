'use strict';

var sync = require('./lib/sync.js');
var cron = require('cron');

var cronJob = cron.job("0 */5 * * * *", function(){
  console.log("START!");
  sync.synchronizeCrmToUmas();
  console.info('cron job completed');
});

cronJob.start();
