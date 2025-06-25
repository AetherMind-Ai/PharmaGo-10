import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import axios from 'axios';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_PRODUCT_API_KEY;
const MAX_RETRIES = 5;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

interface RawProduct {
  'Product Name'?: string;
  Name?: string;
  Product?: string;
  Price?: string;
  'Original Price'?: string;
  Category?: string;
  Brand?: string;
  Ammount?: string;
  Quantity?: string;
  'Expiry Date'?: string;
}

interface EnrichedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  brand: string | null;
  category: string | null;
  expiryDate: string | null;
  productAmount: number;
  description: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  deliveryTime: string;
  tags: string[];
  pharmacyName: string;
  pharmacyId: string; // Added pharmacyId
  prescriptionRequired: boolean;
  createdAt: Date;
}

// Helper functions
function generateRandomId(length = 12): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

async function fetchGoogleSheetCSV(sheetUrl: string, signal?: AbortSignal): Promise<string> {
  const match = sheetUrl.match(/\/d\/(.*?)\//);
  if (!match) throw new Error("Invalid Google Sheet URL format.");
  
  const sheetId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  
  const response = await axios.get(csvUrl, { signal });
  return response.data;
}

const RETRY_DELAY_MS = 2000; // 2 seconds delay between retries

async function fetchFirstImageUrl(query: string, retries = MAX_RETRIES, signal?: AbortSignal): Promise<string | null> {
  if (!query || query.trim() === "") {
    return null;
  }
  
  const backendUrl = `http://localhost:3000/fetch-product-image?query=${encodeURIComponent(query)}`;
  console.log(`  → Searching for image via backend: "${query}"...`);
  try {
    const response = await axios.get(backendUrl, { signal });
    
    if (response.data.success && response.data.imageUrl) {
      const imageUrl = response.data.imageUrl;
      console.log(`    ✔️ Image found: ${imageUrl}`);
      return imageUrl;
    } else {
      console.warn(`    ⚠️ No image found for "${query}" via backend.`);
      return null;
    }
  } catch (error: any) {
    if (signal?.aborted) {
      throw error; // Re-throw AbortError
    }
    console.error(`    ❌ Failed to fetch image for "${query}" via backend: ${error.message}`);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchFirstImageUrl(query, retries - 1, signal);
    }
    return null;
  }
}

async function enrichProductWithGemini(row: RawProduct, imageUrl: string | null, modelName: string, retries = MAX_RETRIES, signal?: AbortSignal): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
    safetySettings,
  });

  const cleanRow = {
    "Product Name": row['Product Name'] || row.Name || row.Product,
    "Price": row.Price,
    "Original Price": row['Original Price'],
    "Category": row.Category,
    "Brand": row.Brand,
    "Amount": row.Ammount || row.Quantity,
    "Expiry Date": row['Expiry Date']
  };

  const prompt = `
    You are a data enrichment expert for an e-commerce platform.
    Process the raw product data below and return a single, clean, structured JSON object.
    
    ## Raw Input Data:
    ${JSON.stringify(cleanRow)}

    ## Instructions:
    1. **Analyze**: Carefully examine the raw data.
    2. **Generate JSON**: Create a JSON object with the exact keys and data types specified in the schema.
    3. **Handle Missing Data**: Use null or a sensible default (e.g., 0 for numbers, empty string for text).
    4. **Quantity**: Extract the quantity from the 'Amount' field. Default to 1 if not present or invalid.
    5. **Description**: Write a compelling, 1-2 sentence marketing description.
    6. **Tags**: Provide exactly 5 relevant SEO tags in English and 5 in Arabic, merged into a single array of 10 strings.

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

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }
    
    const jsonData = JSON.parse(responseText);

    return {
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
      deliveryTime: "90min",
      tags: Array.isArray(jsonData.tags) ? jsonData.tags : [],
    };
  } catch (error: any) {
    if (signal?.aborted) {
      throw error; // Re-throw AbortError
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return enrichProductWithGemini(row, imageUrl, modelName, retries - 1, signal);
    } else {
      throw new Error("Failed to process data with Gemini after multiple retries.");
    }
  }
}

function csvToJson(csvData: string): RawProduct[] {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const result: RawProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      result.push(obj);
    }
  }

  return result;
}

// Check upload limits
async function checkUploadLimits(pharmacyName: string): Promise<{ canUpload: boolean; dailyCount: number; monthlyCount: number }> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const productsRef = collection(db, 'products');
  
  // Check daily uploads
  const dailyQuery = query(
    productsRef,
    where('pharmacyName', '==', pharmacyName),
    where('createdAt', '>=', Timestamp.fromDate(startOfDay))
  );
  const dailySnapshot = await getDocs(dailyQuery);
  const dailyCount = dailySnapshot.size;

  // Check monthly uploads
  const monthlyQuery = query(
    productsRef,
    where('pharmacyName', '==', pharmacyName),
    where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
  );
  const monthlySnapshot = await getDocs(monthlyQuery);
  const monthlyCount = monthlySnapshot.size;

  const canUpload = dailyCount < 250 && monthlyCount < 4000; // Updated daily limit to 250

  return { canUpload, dailyCount, monthlyCount };
}

// Main function to analyze Google Sheet and upload to Firestore
import { doc, deleteDoc } from 'firebase/firestore'; // Import doc and deleteDoc

export async function analyzeGoogleSheetAndUpload(
  sheetUrl: string, 
  pharmacyName: string,
  pharmacyId: string, // Added pharmacyId parameter
  selectedModel: string, // Added selectedModel parameter
  onProgress?: (current: number, total: number, elapsedTimeSeconds: number) => void,
  signal?: AbortSignal // Added AbortSignal
): Promise<{ success: boolean; processedCount: number; totalCount: number; message: string; timeTakenSeconds?: number; uploadedProductIds?: string[]; failedProducts?: { name: string; error: string }[] }> {
  const startTime = Date.now();
  let successfullyProcessedCount = 0;
  const uploadedProductIds: string[] = []; // Track uploaded product IDs
  const failedProducts: { name: string; error: string }[] = []; // Track failed products
  
  try {
    // Check upload limits
    const { canUpload, dailyCount, monthlyCount } = await checkUploadLimits(pharmacyName);
    
    if (!canUpload) {
      const message = dailyCount >= 250
        ? `Daily limit reached (${dailyCount}/250). Try again tomorrow.`
        : `Monthly limit reached (${monthlyCount}/4000). Try again next month.`;
      
      return {
        success: false,
        processedCount: 0,
        totalCount: 0,
        message,
        failedProducts: []
      };
    }

    // Fetch and parse CSV data
    const csvData = await fetchGoogleSheetCSV(sheetUrl, signal);
    const rawProducts = csvToJson(csvData);
    
    if (rawProducts.length === 0) {
      return {
        success: false,
        processedCount: 0,
        totalCount: 0,
        message: "No products found in the sheet.",
        failedProducts: []
      };
    }

    // Calculate how many products we can actually upload
    const remainingDaily = 250 - dailyCount;
    const remainingMonthly = 4000 - monthlyCount;
    const maxUpload = Math.min(remainingDaily, remainingMonthly, rawProducts.length);
    
    const productsToProcess = rawProducts.slice(0, maxUpload);
    const enrichedProducts: EnrichedProduct[] = [];

    // Process each product
    for (let i = 0; i < productsToProcess.length; i++) {
      if (signal?.aborted) {
        throw new Error('Upload aborted by user.');
      }

      const row = productsToProcess[i];
      const productName = row['Product Name'] || row.Name || row.Product || `Product ${i + 1}`;
      
      const elapsedTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
      onProgress?.(i + 1, productsToProcess.length, elapsedTimeSeconds);

      let productProcessed = false;
      let lastError: string = '';
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          let imageUrl = await fetchFirstImageUrl(productName, MAX_RETRIES - attempt, signal);
          
          // Validate image URL
          if (imageUrl) {
            try {
              const imageCheckResponse = await axios.head(imageUrl, { signal, timeout: 5000 }); // 5-second timeout
              if (imageCheckResponse.status !== 200) {
                console.warn(`    ⚠️ Image URL for "${productName}" returned status ${imageCheckResponse.status}. Skipping image.`);
                imageUrl = null; // Set to null if not working
              }
            } catch (imageError: any) {
              if (signal?.aborted) throw imageError;
              console.warn(`    ⚠️ Failed to validate image URL for "${productName}": ${imageError.message}. Skipping image.`);
              imageUrl = null; // Set to null if validation fails
            }
          }

          // If image URL is not valid or not found, skip this product
          if (!imageUrl) {
            lastError = 'Image URL not found or invalid.';
            console.warn(`    ❌ Skipping product "${productName}" due to missing or invalid image URL.`);
            break; // Exit retry loop, mark as failed
          }

          const currentRetries = MAX_RETRIES - attempt;
          const enrichedData = await enrichProductWithGemini(row, imageUrl, selectedModel as string, currentRetries, signal);
          
          // Prepare product for Firestore
          const product: EnrichedProduct = {
            id: enrichedData.id,
            name: enrichedData.productName,
            image: enrichedData.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image', // Fallback image if Gemini somehow returns null
            price: enrichedData.price,
            originalPrice: enrichedData.originalPrice,
            brand: enrichedData.brand || 'Unknown',
            category: enrichedData.category || 'General',
            expiryDate: enrichedData.expiryDate,
            productAmount: enrichedData.quantity,
            description: enrichedData.description,
            rating: 0,
            reviewCount: 0,
            inStock: true,
            deliveryTime: '90min',
            tags: enrichedData.tags,
            pharmacyName,
            pharmacyId, // Add pharmacyId to the product object
            prescriptionRequired: false,
            createdAt: new Date()
          };

          // Add to Firestore
          await addDoc(collection(db, 'products'), {
            ...product,
            createdAt: Timestamp.fromDate(product.createdAt)
          });

          enrichedProducts.push(product);
          uploadedProductIds.push(product.id); // Store the ID
          successfullyProcessedCount++;
          productProcessed = true;
          break; // Exit retry loop on success
        } catch (error: any) {
          if (signal?.aborted) {
            throw error; // Re-throw AbortError
          }
          lastError = error.message;
          // Only log error if it's the last retry
          if (attempt === MAX_RETRIES - 1) {
            console.error(`Failed to process product "${productName}" after multiple retries: ${error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); // Delay before retry
        }
      }
      if (!productProcessed) {
        failedProducts.push({ name: productName, error: lastError || 'Unknown error' });
      }
    }

    const totalTimeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);
    const message = successfullyProcessedCount < rawProducts.length
      ? `Processed ${successfullyProcessedCount}/${rawProducts.length} products. Some failed after multiple retries or due to daily/monthly limits.`
      : `Successfully processed all ${successfullyProcessedCount} products.`;

    return {
      success: true,
      processedCount: successfullyProcessedCount,
      totalCount: rawProducts.length,
      message,
      timeTakenSeconds: totalTimeTakenSeconds,
      uploadedProductIds, // Return uploaded IDs
      failedProducts // Return failed products
    };

  } catch (error: any) {
    // If aborted, delete products that were uploaded in this session
    if (error.message === 'Upload aborted by user.') {
      console.log('Upload aborted. Deleting uploaded products...');
      for (const productId of uploadedProductIds) {
        try {
          await deleteDoc(doc(db, 'products', productId));
          console.log(`Deleted product: ${productId}`);
        } catch (deleteError) {
          console.error(`Failed to delete product ${productId} during rollback:`, deleteError);
        }
      }
      return {
        success: false,
        processedCount: successfullyProcessedCount,
        totalCount: 0,
        message: 'Upload cancelled by user. Uploaded products have been rolled back.',
        timeTakenSeconds: Math.floor((Date.now() - startTime) / 1000),
        uploadedProductIds: [], // Clear IDs as they are deleted
        failedProducts // Return failed products (those that failed before rollback)
      };
    }

    const totalTimeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);
    return {
      success: false,
      processedCount: successfullyProcessedCount,
      totalCount: 0,
      message: `Failed to process sheet: ${error.message}`,
      timeTakenSeconds: totalTimeTakenSeconds,
      uploadedProductIds, // Return uploaded IDs even on other errors (though they won't be rolled back automatically here)
      failedProducts // Return failed products
    };
  }
}
