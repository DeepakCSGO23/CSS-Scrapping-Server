const http = require('http');
const postcss = require('postcss');
const safeParser = require('postcss-safe-parser');
require('dotenv').config();

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/parse-css') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // Parsing the CSS data
                const root = postcss.parse(body, { parser: safeParser });
                console.log('CSS parsed successfully');

                // Example: Sending a simple response
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'CSS parsed successfully' }));
            } catch (error) {
                console.error('Error parsing CSS:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to parse CSS' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const port = process.env.PORT || 5500;
server.listen(port, (err) => {
    if (err) {
        console.log('Something went wrong', err);
    } else {
        console.log('Server is listening on port', port);
    }
});
