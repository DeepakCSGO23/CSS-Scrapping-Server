const http = require('http');
const postcss = require('postcss');
const safeParser = require('postcss-safe-parser');
require('dotenv').config();

// Function to resolve the actual value of a CSS variable
function resolveVariable(value, variablesMap, visited = new Set()) {
    let resolvedValue = value;

    while (resolvedValue.startsWith('var(')) {
        if (visited.has(resolvedValue)) {
            throw new Error('Cyclic variable reference detected');
        }

        visited.add(resolvedValue);

        const match = resolvedValue.match(/var\((--[^,)]+)(?:, *(.*))?\)/);
        const variableName = match[1];
        const fallbackValue = match[2] || '';

        resolvedValue = variablesMap.get(variableName) || fallbackValue;
    }

    return resolvedValue;
}

// Function to process CSS and resolve variables
function processCSS(css) {
    console.log('Received CSS:', css); // Log the raw CSS received

    // Parse CSS
    const root = postcss.parse(css, { parser: safeParser });

    // Step 1: Collect all CSS variables
    const cssVariables = new Map();
    root.walkDecls(decl => {
        if (decl.prop.startsWith('--')) {
            cssVariables.set(decl.prop, decl.value);
        }
    });
    console.log('Collected CSS Variables:', Array.from(cssVariables)); // Log the CSS variables

    // Step 2: Walk through the rules and replace variables with actual values
    root.walkRules(rule => {
        console.log('Processing Rule:', rule.selector); // Log the current rule being processed

        rule.walkDecls(decl => {
            console.log(`Declaration: ${decl.prop} = ${decl.value}`); // Log each declaration

            if (decl.value.includes('var(')) {
                const actualValue = resolveVariable(decl.value, cssVariables);
                console.log(`Resolved Variable: ${decl.prop} = ${actualValue}`); // Log resolved variable
                decl.value = actualValue;
            }
        });
    });

    // Extracting class names with color or background-color properties
    const classColors = new Map();
    root.walkRules(rule => {
        let colorValue = '';
        let backgroundColorValue = '';

        rule.walkDecls(decl => {
            // Check if the declaration is for color
            if (decl.prop === 'color' && decl.value !== 'inherit' && decl.value !== 'transparent') {
                colorValue = decl.value;
            }

            // Check if the declaration is for background-color
            if ((decl.prop==='background'||decl.prop === 'background-color') && decl.value !== 'inherit' && decl.value !== 'transparent') {
                backgroundColorValue = decl.value;
            }
        });

        // Extract class names from selectors
        const selectors = rule.selector.split(',');
        selectors.forEach(selector => {
            const className = selector.trim();
            if (!className.includes(':')) {
                console.log(`Class: ${className}, Color: ${colorValue}, Background: ${backgroundColorValue}`); // Log the class and its colors
                if (colorValue && backgroundColorValue) {
                    classColors.set(className, { color: colorValue, backgroundColor: backgroundColorValue });
                } else if (colorValue) {
                    classColors.set(className, { color: colorValue });
                } else if (backgroundColorValue) {
                    classColors.set(className, { backgroundColor: backgroundColorValue });
                }
            }
        });
    });

    return { root, cssVariables, classColors };
}

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
                // Process the CSS data
                const { root, cssVariables, classColors } = processCSS(body,{ parser: safeParser });

                // Convert Map to Array for easier handling in the response
                const result = Array.from(classColors);
                console.log('Final Result:', JSON.stringify({ classColors: result, cssVariables: Array.from(cssVariables) }, null, 2)); // Log the final output

                // Send the response with the extracted class names and colors
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ classColors: result, cssVariables: Array.from(cssVariables) }));
            } catch (error) {
                console.error('Error parsing CSS:', error); // Log the error details
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to parse CSS' }));
            }
        });
    }
    // a endpoint so that we can ping here
    else if(req.method=='GET'&&req.url==='/health'){
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end('Server is up and running')
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const port = process.env.PORT || 3000; // Default to port 3000 if not specified
server.listen(port, (err) => {
    if (err) {
        console.log('Something went wrong', err);
    } else {
        console.log('Server is listening on port', port);
    }
});
