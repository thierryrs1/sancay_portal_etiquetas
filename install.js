var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'SpsPortalEtiquetasHMG',
  description: 'SPS Portal de Etiquetas HMG (8887)',
  script: require('path').join(__dirname, 'index.js'),
  execPath: "C:/SPS/HMG/portal.etiqueta/node.exe",
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]

});
//svc.logOnAs.domain = 'mydomain.local';
//svc.logOnAs.account = 'username';
//svc.logOnAs.password = 'password';

svc.on('install', function () {
  svc.start();
});

svc.install();