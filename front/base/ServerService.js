function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request({
  url,
  data,
  header,
  method = "GET",
  timeout = 180000
}) {
  const customHeaders = {
    "Content-Type": "application/json"
  };

  if (header) for (prop in header) customHeaders[prop] = header[prop];

  return new Promise((resolve, reject) => {
    $.ajax({
      timeout: timeout,
      async: true,
      crossDomain: true,
      url: url,
      method: method,
      headers: customHeaders,
      /*xhrFields: {
        withCredentials: true
      },*/
      processData: false,
      data: data != undefined ? JSON.stringify(data) : null,
      success: function(result) {
        resolve(result);
      },
      error: function(data, textStatus, errorThrown) {
        reject({
          url,
          data,
          textStatus,
          error: errorThrown
        });
      }
    });
  });
}

sap.ui.define(["sap/ui/base/Object"], function(
  Object
) {
  "use strict";
  return Object.extend("sps.wms.base.ServerService", {
    constructor: function() {},
    getToken: function() {
      return sessionStorage.getItem("token");
    },

    login: async function({ username, password, timeout = 30000 }) {
      const url = "/Login";

      const data = {
        username,
        password
      };

      const response = await request({
        method: "POST",
        url,
        data,
        timeout
      });

      sessionStorage.setItem("token", response.token);
      return response;
    },

    get: async function(route, timeout = 60000) {
      const url = route;
      const header = {
        authorization: "Bearer " + this.getToken()
      };

      const response = await request({
        method: "GET",
        url,
        header,
        timeout
      });

      return response;
    },

    post: async function(route, data, timeout = 60000) {
      const url = route;
      const header = {
        authorization: "Bearer " + this.getToken()
      };

      const response = await request({
        method: "POST",
        url,
        header,
        data,
        timeout
      });

      return response;
    }
  });
});
