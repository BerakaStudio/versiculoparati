// api/gemini.js - Backend endpoint para llamadas a Gemini
export default async function handler(req, res) {
  // Solo permitir POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtener la clave de API desde variables de entorno
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Clave de API no configurada' });
  }

  try {
    const { userInput } = req.body;
    
    if (!userInput || userInput.trim() === '') {
      return res.status(400).json({ error: 'Texto de entrada requerido' });
    }

    const prompt = `
    Un usuario, que busca consuelo bíblico, ha escrito el siguiente texto sobre sus sentimientos: "${userInput}"

    Tu tarea es actuar como un consejero cristiano sabio, cercano y empático. Analiza profundamente los sentimientos del usuario, identifica las emociones específicas, situaciones mencionadas, y preocupaciones particulares. Responde ÚNICAMENTE con un objeto JSON válido que siga esta estructura exacta. No incluyas explicaciones ni texto adicional fuera del JSON.

    La estructura del JSON debe ser:
    {
      "briefSummary": "Un resumen muy breve de 3-5 palabras que capture la esencia de lo que siente el usuario (ej: 'ansiedad y tristeza', 'soledad y miedo', 'agradecimiento y paz')",
      "initialReflection": "Un mensaje reflexivo inicial personalizado, cálido y profundamente empático, de 6-9 frases. Debe reconocer específicamente los sentimientos expresados por el usuario, ofrecer comprensión genuina, y brindar esperanza de manera personal y directa. Evita frases genéricas y conecta directamente con la situación emocional del usuario.",
      "verses": [
        {
          "reference": "Referencia del primer versículo (ej. 'Mateo 11:28')",
          "text": "El texto completo del primer versículo, basado en una traducción de lenguaje actual como la TLA.",
          "reflection": "Una frase reflexiva corta, alentadora y directamente relacionada con este versículo."
        },
        {
          "reference": "Referencia del segundo versículo (ej. 'Salmo 23:1')",
          "text": "El texto completo del segundo versículo.",
          "reflection": "Otra frase reflexiva para el segundo versículo."
        },
        { "reference": "...", "text": "...", "reflection": "..." },
        { "reference": "...", "text": "...", "reflection": "..." },
        { "reference": "...", "text": "...", "reflection": "..." }
      ]
    }

    Por favor, asegúrate de que el array 'verses' contenga exactamente 5 versículos relevantes para los sentimientos del usuario. El tono debe ser siempre de esperanza, comprensión y empatía. El mensaje de reflexión inicial debe ser específico para la situación del usuario, mencionando elementos concretos de lo que compartió, y ofreciendo consuelo personalizado que demuestre que realmente has comprendido su corazón.

    IMPORTANTE: El 'briefSummary' debe ser muy conciso, en español, y capturar la emoción principal en pocas palabras naturales.
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error en la API de IA: ${response.status} ${response.statusText}. Detalles: ${errorBody}`);
    }
    
    const result = await response.json();
    
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
      const jsonString = result.candidates[0].content.parts[0].text;
      const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(cleanedJsonString);
      
      if (!parsedResult.briefSummary || !parsedResult.initialReflection || !parsedResult.verses || !Array.isArray(parsedResult.verses) || parsedResult.verses.length === 0) {
        throw new Error("La IA no devolvió la estructura JSON esperada.");
      }
      
      return res.status(200).json(parsedResult);
    } else {
      if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason === 'SAFETY') {
        throw new Error('La respuesta fue bloqueada por motivos de seguridad. Intenta reformular tu consulta.');
      }
      throw new Error('La respuesta de la app no contiene texto válido o tiene un formato inesperado.');
    }

  } catch (error) {
    console.error("Error en el endpoint de Gemini:", error);
    return res.status(500).json({ 
      error: error.message || "No se pudo procesar tu solicitud con la IA. Por favor, inténtalo de nuevo." 
    });
  }
}