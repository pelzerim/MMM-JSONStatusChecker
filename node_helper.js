/* Magic Mirror
 * Node Helper: MMM-PuppeteerChecker
 *
 * By pelzerim
 *
 * Original https://github.com/shbatm/MMM-JSONStatusChecker by By shbatm
 *
 * MIT Licensed.
 */
/* jshint node: true, esversion: 6*/

const NodeHelper = require("node_helper");
const puppeteer = require("puppeteer");

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
    this.config = {};
  },

  getData: function (name) {
    var self = this;

    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
      const fn = this.config[name].puppeteer;

      const browser = await puppeteer.launch();
      let result;

      try {
        result = await fn(browser);
      } catch (error) {
        console.log(error);
      }

      await browser.close();

      if (result !== undefined) {
        console.log("emitting", "DATA_" + name, result);
        self.sendSocketNotification("DATA_" + name, result);
      }

      resolve();
    }).catch((err) => {
      console.warn(name, "Could not load data.", err);
    });

    setTimeout(function () {
      self.getData(name);
    }, this.config[name].updateInterval);
  },

  socketNotificationReceived: function (notification, unparsedPayload) {
    var self = this;
    if (notification === "CONFIG") {
      // https://forum.magicmirror.builders/topic/12871/how-to-send-a-function-as-payload-of-socket-notification/5
      let reviver = (key, value) => {
        if (typeof value === "string" && value.indexOf("__FUNC__") === 0) {
          value = value.slice(8);
          let functionTemplate = `(${value})`;
          return eval(functionTemplate);
        }
        return value;
      };

      const payload = JSON.parse(unparsedPayload, reviver);

      if (!(payload.name in self.config)) {
        console.log("Starting data calls for " + payload.name);
        self.config[payload.name] = payload;
        self.sendSocketNotification("STARTED", payload.name);
        self.getData(payload.name);
      }
    }
  }
});
