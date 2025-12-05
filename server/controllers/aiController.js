const axios = require('axios');

// @desc    Generate AI Diagnosis & Prescription
// @route   POST /api/ai/generate
// @access  Private (Doctor Only)
exports.generateDiagnosis = async (req, res) => {
  const { symptoms, labResults, vitals } = req.body;

  try {
    const apiKey = process.env.AI_API_KEY;
    const modelId = process.env.AI_MODEL_ID || 'tngtech/deepseek-r1t2-chimera:free';
    const apiUrl = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

    if (!apiKey) {
      return res.status(500).json({ message: 'AI Service not configured (Missing API Key)' });
    }

    const prompt = `
      You are an expert medical AI assistant. Based on the following patient data, suggest a likely diagnosis and a prescription plan.
      
      Patient Data:
      - Symptoms: ${symptoms || 'None provided'}
      - Vitals: ${vitals ? JSON.stringify(vitals) : 'None provided'}
      - Lab Results: ${labResults ? JSON.stringify(labResults) : 'None provided'}

      Respond ONLY in valid JSON format with the following structure:
      {
        "diagnosis": "Name of the condition",
        "medicines": [
          {
            "name": "Medicine Name",
            "dosage": "e.g., 500mg",
            "frequency": "e.g., Twice daily",
            "duration": "e.g., 5 days",
            "route": "e.g., Oral",
            "timing": "e.g., After Meal",
            "notes": "Optional notes"
          }
        ]
      }
      Do not include any markdown formatting (like \`\`\`json), just the raw JSON object.
    `;

    const response = await axios.post(apiUrl, {
      model: modelId,
      messages: [
        { role: 'system', content: 'You are a helpful medical assistant. Always output valid JSON.' },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8000', // Required by OpenRouter
        'X-Title': 'QuadraCare' // Required by OpenRouter
      }
    });

    let aiData = response.data.choices[0].message.content;

    // Clean up potential markdown formatting
    aiData = aiData.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(aiData);
    res.json(result);

  } catch (error) {
    console.error('AI Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Failed to generate suggestion from AI provider' });
  }
};
