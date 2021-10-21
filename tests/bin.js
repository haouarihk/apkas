const {join} = require('path');

const args = process.argv;
args[0] = join(__dirname, './tests');
require('..')(args)