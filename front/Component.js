/* eslint-disable prefer-rest-params */
/* eslint-disable no-undef */
sap.ui.define(
  ["sap/ui/core/UIComponent", "sps/wms/model/models"],
  (UIComponent, models) =>
    UIComponent.extend("sps.wms.Component", {
      metadata: {
        manifest: "json"
      },
      init() {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(models.createDeviceModel(), "device");
      }
    })
);
