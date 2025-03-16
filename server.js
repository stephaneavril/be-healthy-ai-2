require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const PORT = process.env.PORT || 8080;

if (!LEONARDO_API_KEY) {
  console.error("❌ ERROR: Leonardo API Key is missing! Check your .env file.");
  process.exit(1);
}

app.post("/generate", async (req, res) => {
  try {
    const { respuestas } = req.body;
    if (!respuestas || respuestas.length < 4) {
      return res.status(400).json({ error: "Se requieren 4 respuestas para generar la imagen" });
    }

    const finalPrompt = `
A vibrant and artistic digital illustration of a person engaging in a healthy lifestyle:
- Eating: ${respuestas[0]} (fresh food, colorful composition).
- Exercise: ${respuestas[1]} (running, yoga, or other fitness activity).
- Mental Wellness: ${respuestas[2]} (calm expression, meditation).
- Rest: ${respuestas[3]} (soft lighting, peaceful setting).
The image should be warm, modern, and inspiring, with a balanced composition.
`;

    console.log("🔹 Generating image with prompt:", finalPrompt);

    // Send the generation request to Leonardo
    const postResponse = await axios.post(
      "https://cloud.leonardo.ai/api/rest/v1/generations",
      {
        alchemy: true,
        height: 768,
        width: 1024,
        modelId: "b24e16ff-06e3-43eb-8d33-4416c2d75876", // Use the recommended modelId
        num_images: 1,
        presetStyle: "DYNAMIC",
        prompt: finalPrompt
      },
      {
        headers: {
          "Authorization": `Bearer ${LEONARDO_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    if (!postResponse.data || !postResponse.data.sdGenerationJob) {
      throw new Error("No generation job returned from API");
    }

    const generationId = postResponse.data.sdGenerationJob.generationId;
    console.log("Generation ID:", generationId);

    // Poll for the generated image until it's available
    let imageUrl = null;
    let pollAttempts = 0;
    const maxAttempts = 20; // Adjust as needed
    while (pollAttempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      pollAttempts++;
      console.log(`Polling attempt ${pollAttempts} for generation ID ${generationId}...`);
      
      const pollResponse = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            "Authorization": `Bearer ${LEONARDO_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        }
      );
      // Leonardo's API returns the result in "generations_by_pk.generated_images"
      if (
        pollResponse.data &&
        pollResponse.data.generations_by_pk &&
        pollResponse.data.generations_by_pk.generated_images &&
        pollResponse.data.generations_by_pk.generated_images.length > 0
      ) {
        // Assume that each generated image object has a "url" property
        imageUrl = pollResponse.data.generations_by_pk.generated_images[0].url;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: "No image returned from API after polling" });
    }

    console.log("✅ Image URL:", imageUrl);
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error("❌ Error generating image:", error.response?.data || error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
