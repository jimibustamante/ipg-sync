'use strict';

var sync = require('./lib/sync.js');
var cron = require('cron');

var cronJob = cron.job("0 0 */2 * * *", function(){
  console.log("CRON START!");
  sync.synchronizeCrmToUmas();
  console.info('cron job completed');
});

cronJob.start();
