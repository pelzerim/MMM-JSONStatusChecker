/* global Module */

/* Magic Mirror
 * Module: MMM-PuppeteerChecker
 *
 * By pelzerim
 *
 * Original https://github.com/shbatm/MMM-JSONStatusChecker by By shbatm
 *
 * MIT Licensed.
 */

Module.register("MMM-PuppeteerChecker", {
  defaults: {
    name: "PuppeteerChecker",
    updateInterval: 600000,
    trueString: "{{RESULT}} verfügbar",
    falseString: "Keine verfügbar",
    icon: "charging-station",
    puppeteer: async () => {},
    check: () => false
  },

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function () {
    this.trueResult = false;
    this.resultChanged = true;

    //Flag for check if module is loaded
    this.loaded = false;
    this.error = false;

    // https://forum.magicmirror.builders/topic/12871/how-to-send-a-function-as-payload-of-socket-notification/5
    let replacer = (key, value) => {
      if (typeof value === "function") {
        return "__FUNC__" + value.toString();
      }
      return value;
    };

    this.sendSocketNotification(
      "CONFIG",
      JSON.stringify(this.config, replacer, 2)
    );
  },

  getDom: function () {
    var self = this;

    // create element wrapper for show into the module
    var wrapper = document.createElement("div");
    wrapper.className = "small";

    if (!this.loaded) {
      wrapper.innerHTML = "Loading " + this.config.name + " Status ...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (this.error) {
      wrapper.innerHTML = "Error loading data for " + this.config.name;
      return wrapper;
    }

    // If this.resultData is not empty
    if (this.resultData !== undefined) {
      const icon = document.createElement("i");
      icon.setAttribute("aria-hidden", "true");
      icon.className = "fa fa-" + this.config.icon;

      const txt = document.createElement("span");

      if (this.trueResult) {
        if (icon) {
          icon.style.cssText = "color:green;";
        }
        txt.innerHTML =
          "&nbsp;&nbsp;" +
          this.config.trueString.replace("{{RESULT}}", this.resultData);
      } else {
        icon.style.cssText = "color:red;";
        txt.innerHTML =
          "&nbsp;&nbsp;" +
          this.config.falseString.replace("{{RESULT}}", this.resultData);
      }

      if (icon) {
        wrapper.appendChild(icon);
      }
      wrapper.appendChild(txt);
    }
    return wrapper;
  },

  getScripts: function () {
    return [];
  },

  // Define requird styles
  getStyles: function () {
    return ["font-awesome.css"];
  },

  processData: function (data) {
    var self = this;
    this.resultData = data;
    if (this.loaded === false) {
      self.updateDom(self.config.animationSpeed);
    }
    this.loaded = true;

    var oldValue = this.trueResult;

    this.trueResult = this.config.check(this.resultData);

    this.resultChanged = oldValue !== this.trueResult;

    this.updateDom();
  },

  socketNotificationReceived: function (notification, payload) {
    console.log(notification, payload);
    if (notification === "STARTED" && payload === this.config.name) {
      this.updateDom();
    } else if (notification === "DATA_" + this.config.name) {
      this.loaded = true;
      this.error = false;
      this.processData(payload);
    } else if (notification === "DATA_ERROR_" + this.config.name) {
      this.loaded = true;
      this.error = true;
      this.updateDom();
    }
  }
});
