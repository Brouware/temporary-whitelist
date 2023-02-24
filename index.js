const Keyv = require('keyv');
const http = require('http');
const { proxy: forward } = require('fast-proxy')({});

const keyv = new Keyv();

const server = http.createServer();

const hiddenInputName = "reply";
const hiddenInputValue = "yes";
const hiddenInputSize = new Blob([`${hiddenInputName}=${hiddenInputValue}`]).size.toString();
const whitelistAmountTime = 3 * 60 * 60 * 1000;

server.on('request', async (req, res) => {
    const ipAddress = req.headers['x-real-ip'];
    if (await keyv.get(ipAddress)) {
        forward(req, res, 'http://127.0.0.1:3000' + req.url, {})
    }
    else if (req.method === "POST" && req.headers['content-type'] === "application/x-www-form-urlencoded"
        && req.headers['content-length'] === hiddenInputSize) {
        let body = "";
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
            await keyv.set(ipAddress, true, whitelistAmountTime);
            res.writeHead(302, {
                'Location': req.url
            });
            res.end();
        });

    }
    else {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(403);
        res.end(`<html>
        <head><title>Invidious test instance warning</title></head><body>
        <p><b>The test Invidious instance has very little resources, click <a href="https://redirect.invidious.io${req.url}">here</a>
        for using a public instance if you are not testing!</b><br>
        You will get the same exact features as this current website!<br>
        <br>Fill the form below if you want to do some testing. You will be whitelisted for 3 hours.</p>
        <form method="post">
        <label for="fname">Enter yes if you want to do some testing on this instance:</label><br>
        <input type="text" id="reply" name="reply"><br>
        <input type="submit" value="Submit">
        </form>
        </body></html>`);
    }
});

server.listen(8000);

console.log("Server listening");
