var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {"Content-Type": "text/html"});
  res.write('<img src="https://cdn.discordapp.com/attachments/1046990538919919716/1047007278500433990/Zias.png" width="500" style="margin:0 500px"">');
  res.end();
}).listen(8080);