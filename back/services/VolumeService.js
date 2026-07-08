/* eslint-disable consistent-return */
const { ServiceLayer , DirectDb } = require("sps-sap-interface");

class VolumeService {
  
  async criaVolume(data) {
    const volume = await ServiceLayer.execute({
      url: "SPS_VOLUMES",
      method: "POST",
      data,
    });
    return volume;
  }
}

module.exports = new VolumeService();