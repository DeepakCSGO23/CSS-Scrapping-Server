const https = require('https');
const postcss = require('postcss');
const safeParser = require('postcss-safe-parser');
require('dotenv').config();

const server = https.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows all origins
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'); // Allows POST and GET methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allows content-type header

    if (req.method === 'POST' && req.url === '/parse-css') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // Parsing the CSS data
                const root = postcss.parse(body, { parser: safeParser });

                // Extracting class names with color or background-color properties
                const classNames = new Set();
                root.walkRules(rule => {
                    let hasColorProperty = false;

                    rule.walkDecls(decl => {
                        if (decl.prop === 'color' || decl.prop === 'background-color') {
                            hasColorProperty = true;
                        }
                    });

                    if (hasColorProperty) {
                        // Extract class names from selectors
                        const selectors = rule.selector.split(',');
                        selectors.forEach(selector => {
                            const className = selector.trim().replace(/^\./, ''); // Remove leading dot if present
                            classNames.add(className);
                        });
                    }
                });

                // Convert Set to Array for easier handling in the response
                const result = Array.from(classNames);
                
                // Send the response with the extracted class names
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ classNames: result }));

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

const port = process.env.PORT;
server.listen(port, (err) => {
    if (err) {
        console.log('Something went wrong', err);
    } else {
        console.log('Server is listening on port', port);
    }
});
