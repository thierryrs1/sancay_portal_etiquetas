var Service = require('node-windows').Service;

var svc = new Service({
  name:'SpsPortalEtiquetasHMG',
  script: require('path').join(__dirname,'index.js')
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

svc.uninstall();