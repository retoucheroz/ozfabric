const https = require('https');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment from .env.local manually since dotenv sometimes needs help with absolute paths in some environments
try {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log("Could not load .env.local", e.message);
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found in environment");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching model list...");

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("AVAILABLE MODELS:");
                json.models.forEach(m => {
                    // Filter for models that support 'generateContent'
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                        console.log(`- ${m.name.replace('models/', '')}`);
                    }
                });
            } else {
                console.log("Error response API:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("Parse error", e);
            console.log("Raw Response:", data);
        }
    });
}).on("error", (err) => {
    console.error("Connection Error: " + err.message);
});
