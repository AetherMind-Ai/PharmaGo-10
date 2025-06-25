// --- Dependencies ---
const express = require("express");
const axios = require("axios");
const csv = require("csvtojson");
const fs = require("fs");
const cheerio = require('cheerio'); // Added cheerio
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const crypto = require('crypto');

// --- Configuration ---
const app = express();
const PORT = 3000;
// ⚠️ IMPORTANT: Replace with your real key. Do not commit this to a public repository.
const GEMINI_API_KEY = "AIzaSyCLoeLKt6C7S7d47kva7ARVZkxrXnF7iRM"; 
const MAX_RETRIES = 5; // Maximum retries for product analysis

// --- Client Initialization ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ===================================================================================
// HELPER FUNCTIONS (Reliable and unchanged)
// ===================================================================================

async function fetchGoogleSheetCSV(sheetUrl) {
    const match = sheetUrl.match(/\/d\/(.*?)\//);
    if (!match) throw new Error("Invalid Google Sheet URL format.");
    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    console.log("Fetching data from Google Sheet...");
    const response = await axios.get(csvUrl);
    console.log("✅ Google Sheet data fetched.");
    return response.data;
}

function generateRandomId(length = 12) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function fetchFirstImageUrl(query, retries = 3) {
    const fullQuery = `${query} medicine`; // Append "medicine" to the query
    if (!fullQuery || fullQuery.trim() === " medicine") { // Check for empty query after appending
        console.warn("    ⚠️ Image search skipped: No product name provided.");10n 
        return null;
    }
    console.log(`  → [Image] Searching Bing for: "${fullQuery}"...`);

    for (let i = 0; i < retries; i++) {
        try {
            const url = `https://www.bing.com/images/search?q=${encodeURIComponent(fullQuery)}`;

            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0', // Avoid bot detection
                },
            });

            const $ = cheerio.load(data);

            const firstImage = $('a.iusc').first().attr('m'); // Bing uses JSON in attribute "m"

            if (firstImage) {
                const imageJson = JSON.parse(firstImage);
                const imageUrl = imageJson.murl;

                // Validate image URL by making a HEAD request
                try {
                    const imageResponse = await axios.head(imageUrl, { timeout: 5000 });
                    if (imageResponse.status === 200) {
                        console.log(`    ✔️ Image found and validated: ${imageUrl}`);
                        return imageUrl;
                    } else {
                        console.warn(`    ⚠️ Image URL returned status ${imageResponse.status}. Retrying...`);
                    }
                } catch (validationError) {
                    console.warn(`    ⚠️ Image URL validation failed for ${imageUrl}: ${validationError.message}. Retrying...`);
                }
            } else {
                console.warn(`    ⚠️ No image found for "${fullQuery}". Retrying...`);
            }
        } catch (error) {
            console.error(`    ❌ Image fetch failed for "${fullQuery}" (Attempt ${i + 1}/${retries}): ${error.message}`);
        }
    }
    console.error(`    ❌ Failed to find a working image after ${retries} attempts for "${fullQuery}".`);
    return null;
}

// ===================================================================================
// CORE GEMINI FUNCTION (FIXED)
// ===================================================================================

async function enrichProductWithGemini(row, imageUrl, modelName, retries = MAX_RETRIES) {
    const model = genAI.getGenerativeModel({
        model: modelName, // Use the passed modelName
        generationConfig: { responseMimeType: "application/json" },
        safetySettings,
    });

    // Clean up the row to send only relevant data to the AI
    const cleanRow = {
        "Product Name": row['Product Name'] || row.Name || row.Product,
        "Price": row.Price,
        "Original Price": row['Original Price'],
        "Category": row.Category,
        "Brand": row.Brand,
        "Amount": row.Ammount || row.Quantity, // Corrected 'Ammount' typo common in sheets
        "Expiry Date": row['Expiry Date']
    };

    const prompt = `
    You are a data enrichment expert for an e-commerce platform.
    Process the raw product data below and return a single, clean, structured JSON object.
    
    ## Raw Input Data:
    ${JSON.stringify(cleanRow)}

    ## Instructions:
    1.  **Analyze**: Carefully examine the raw data.
    2.  **Generate JSON**: Create a JSON object with the exact keys and data types specified in the schema.
    3.  **Handle Missing Data**: Use null or a sensible default (e.g., 0 for numbers, empty string for text).
    4.  **Quantity**: Extract the quantity from the 'Amount' field. Default to 1 if not present or invalid.
    5.  **Description**: Write a compelling, 1-2 sentence marketing description.
    6.  **Tags**: Provide exactly 5 relevant SEO tags in English and 5 in Arabic, merged into a single array of 10 strings.

    ## Required JSON Schema:
    {
      "productName": "string",
      "price": "number",
      "originalPrice": "number",
      "brand": "string | null",
      "category": "string | null",
      "expiryDate": "string | null", 
      "quantity": "number",
      "description": "string",
      "rating": "number",
      "reviewCount": "number",
      "tags": ["string"]
    }
    `;

    console.log(`  → [Gemini] Enriching product data (Retries left: ${retries})...`);
    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        if (!responseText) {
            throw new Error("Gemini returned an empty response.");
        }
        
        const jsonData = JSON.parse(responseText);

        const finalData = {
            id: generateRandomId(),
            productName: jsonData.productName || cleanRow['Product Name'] || `Product ${generateRandomId(5)}`,
            imageUrl: imageUrl,
            price: Number(jsonData.price) || 0,
            originalPrice: Number(jsonData.originalPrice) || Number(jsonData.price) || 0,
            brand: jsonData.brand || null,
            category: jsonData.category || null,
            expiryDate: jsonData.expiryDate || null,
            quantity: Number(jsonData.quantity) || 1,
            description: jsonData.description || "",
            rating: Number(jsonData.rating) || 0,
            reviewCount: Number(jsonData.reviewCount) || 0,
            inStock: true,
            time: "90min",
            tags: Array.isArray(jsonData.tags) ? jsonData.tags : [],
        };
        
        console.log("    ✔️ Gemini enrichment successful.");
        return finalData;

    } catch (error) {
        console.error(`    ❌ Gemini enrichment failed: ${error.message}`);
        if (error instanceof SyntaxError && error.message.includes("Unexpected token") && 'result' in locals) {
             console.error("    Invalid JSON received from Gemini:", result.response.text());
        }

        if (retries > 0) {
            console.log(`    Retrying... (${retries - 1} attempts left)`);
            // Removed the delay as requested
            return enrichProductWithGemini(row, imageUrl, modelName, retries - 1);
        } else {
            throw new Error("Failed to process data with Gemini after multiple retries.");
        }
    }
}


// ===================================================================================
// MAIN EXPRESS ROUTES
// ===================================================================================

// Middleware to enable CORS for all origins (for development purposes)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// API endpoint to fetch product image
app.get("/fetch-product-image", async (req, res) => {
    const productName = req.query.query;
    if (!productName) {
        return res.status(400).json({ error: "Missing 'query' parameter for product name." });
    }

    try {
        const imageUrl = await fetchFirstImageUrl(productName);
        if (imageUrl) {
            res.json({ success: true, imageUrl });
        } else {
            res.status(404).json({ success: false, message: `No image found for "${productName}".` });
        }
    } catch (error) {
        console.error(`Error in /fetch-product-image for "${productName}":`, error.message);
        res.status(500).json({ success: false, message: `Failed to fetch image: ${error.message}` });
    }
});

app.get("/analyze-sheet", async (req, res) => {
    const sheetUrl = req.query.url;
    const selectedModel = req.query.model || "gemini-1.5-flash"; // Default to gemini-1.5-flash
    
    if (!sheetUrl) {
        return res.status(400).json({ error: "Missing 'url' query parameter." });
    }

    try {
        console.time("Total processing time");
        const csvData = await fetchGoogleSheetCSV(sheetUrl);
        const rawProducts = await csv().fromString(csvData);
        console.log(`✅ Loaded ${rawProducts.length} products. Starting enrichment with model: ${selectedModel}...\n`);

        const enrichedProducts = [];

        for (let i = 0; i < rawProducts.length; i++) {
            const row = rawProducts[i];
            const productName = row['Product Name'] || row.Name || row.Product || `Product ${i + 1}`;
            console.log(`--- Processing [${i + 1}/${rawProducts.length}]: "${productName}" ---`);

            try {
                // The image fetching will now be done via the new API endpoint from the client-side
                // This server-side route will not directly call fetchFirstImageUrl for sheet processing.
                // The client-side googleSheetAnalyzer.ts will call the /fetch-product-image endpoint.
                const enrichedData = await enrichProductWithGemini(row, null, selectedModel, MAX_RETRIES); // Pass selectedModel
                enrichedProducts.push(enrichedData);
                console.log(`✅ Successfully processed "${productName}".\n`);
            } catch (error) {
                console.error(`❌ SKIPPED product "${productName}" due to an error: ${error.message}\n`);
            }
        }

        const outputPath = "data.json";
        fs.writeFileSync(outputPath, JSON.stringify(enrichedProducts, null, 2));
        console.log(`\n🎉 Success! Wrote ${enrichedProducts.length}/${rawProducts.length} products to "${outputPath}".`);
        
        console.timeEnd("Total processing time");
        res.json({
            message: "Processing complete.",
            processedCount: enrichedProducts.length,
            totalCount: rawProducts.length,
            outputFile: outputPath,
            data: enrichedProducts
        });

    } catch (err) {
        console.error("A critical error occurred:", err.message);
        res.status(500).json({ error: "A critical error occurred during processing.", details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("You can now run your curl command in a new terminal window:");
    console.log(`curl "http://localhost:3000/analyze-sheet?url=https://docs.google.com/spreadsheets/d/1wB_fj_QP0f8jIZfu1RPRE__5nC5AVzq9tuosUeaNv-I/edit"`);
    console.log(`To test image search: curl "http://localhost:3000/fetch-product-image?query=Panadol"`);
});
