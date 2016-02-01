var fs = require('node-fs-extra');
var path = require('path');

fs.mkdirsSync(path.join(__dirname, '../www/lib/youbetter-desktop-app'));

fs.copySync(
    path.join(__dirname, '../node_modules/youbetter-desktop-app/dist'),
    path.join(__dirname, '../www/lib/youbetter-desktop-app')
);
