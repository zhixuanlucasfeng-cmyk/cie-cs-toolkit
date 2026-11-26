const {devices} = require('@playwright/test');
const base = require('./playwright.config');
module.exports = {
  ...base,
  testMatch:'**/classroom-browser.spec.js',
  projects:[
    {name:'Safari WebKit', use:{browserName:'webkit'}},
    {name:'iPad touch', use:{...devices['iPad Pro 11'], browserName:'webkit'}}
  ]
};
