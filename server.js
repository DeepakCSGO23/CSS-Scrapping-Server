const http = require('http');
const postcss = require('postcss');
const safeParser = require('postcss-safe-parser');
require('dotenv').config();

const server = http.createServer((req, res) => {
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
                const classColors = new Map();
                const cssVariables=new Map()
                root.walkRules(rule => {
                    let colorValue = '';
                    let backgroundColorValue = '';
                    
                    rule.walkDecls(decl => {
                        if(decl.prop.startsWith('--')&&!decl.value.startsWith('var')){
                            cssVariables.set(decl.prop,decl.value)
                        }
                        // Check if the declaration is for color
                        if (decl.prop === 'color'&&decl.value!=='inherit'&&decl.value!=='transparent') {
                            colorValue = decl.value;
                        }
                
                        // Check if the declaration is for background-color
                        if (decl.prop === 'background-color'&&decl.value!=='inherit'&&decl.value!=='transparent') {
                            backgroundColorValue = decl.value;
                        }
                    });
                
                    // Extract class names from selectors
                    const selectors = rule.selector.split(',');
                    selectors.forEach(selector => {
                        const className = selector.trim(); 
                        if (!className.includes(':')) {
                            if (colorValue && backgroundColorValue) {
                                // Class has both color and background-color
                                classColors.set(className, { color: colorValue, backgroundColor: backgroundColorValue });
                            } else if (colorValue) {
                                // Class has only color
                                classColors.set(className, { color: colorValue });
                            } else if (backgroundColorValue) {
                                // Class has only background-color
                                classColors.set(className, { backgroundColor: backgroundColorValue });
                            }
                        }
                    });
                });
                
                
                // Convert Map to Array for easier handling in the response
                const result = Array.from(classColors);
                // Send the response with the extracted class names and colors
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ classColors: result,cssVariables:Array.from(cssVariables) }));

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
