const express = require('express');
const serveIndex = require('serve-index');
const app = express();

app.use(express.static(__dirname + '/pages'), serveIndex(__dirname + '/pages'));
app.listen(8080);