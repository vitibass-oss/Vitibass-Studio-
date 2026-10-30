import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for generating with text fallback if model is unavailable
async function generateTextWithFallback(
  primaryModel: string,
  fallbackModel: string,
  contents: any,
  config?: any
) {
  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config,
    });
    return response.text || '';
  } catch (err: any) {
    console.warn(`Primary model ${primaryModel} failed (${err.message}), falling back to ${fallbackModel}`);
    const fallbackResponse = await ai.models.generateContent({
      model: fallbackModel,
      contents,
      config,
    });
    return fallbackResponse.text || '';
  }
}

// 1. Generate Simultaneous Cross-Platform Campaign
app.post('/api/generate-campaign', async (req, res) => {
  try {
    const {
      idea,
      tone = 'professional',
      targetAudience = '',
      imageSettings = {},
    } = req.body;

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid idea' });
    }

    const prompt = `Eres un estratega de crecimiento en redes sociales y copywriter de élite.
Tu objetivo es transformar la siguiente idea en publicaciones optimizadas y de alto rendimiento simultáneamente para LinkedIn, Twitter/X e Instagram en IDIOMA ESPAÑOL (español natural, fluido, convincente y adaptado a la audiencia).

IDEA DEL USUARIO:
"${idea}"

TONO DESEADO:
${tone} (Aplica este tono rigurosamente en cada borrador: ${
      tone === 'witty'
        ? 'Ingenioso, con humor inteligente, perspicaz, con chispa y personalidad.'
        : tone === 'urgent'
        ? 'Urgente, de alto impacto, enfocado a la acción inmediata, con sensación de oportunidad/FOMO.'
        : tone === 'professional'
        ? 'Profesional, autoritario, fundamentado, con criterio y estándar de liderazgo de opinión.'
        : tone === 'inspirational'
        ? 'Inspirador, motivador, con visión de futuro y empatía.'
        : 'Educativo, analítico, desglosado paso a paso con valor práctico.'
    })

AUDIENCIA OBJETIVO:
${targetAudience || 'Profesionales ambiciosos, fundadores, creadores y líderes técnicos'}

IDIOMA:
Escribe todo el contenido de las publicaciones, ganchos y llamadas a la acción estrictamente en ESPAÑOL.

REQUISITOS ESPECÍFICOS POR PLATAFORMA:
1. "linkedin":
   - Formato largo (150 a 300 palabras).
   - Gancho inicial contundente (1 o 2 líneas magnéticas para detener el scroll).
   - Espaciado generoso entre párrafos para lectura ágil en móviles.
   - Lección central, storytelling o desglose estructurado con viñetas.
   - Pregunta final estimulante para abrir debate en comentarios.
   - 3 a 5 hashtags profesionales en español/inglés relevantes.
   - "imagePrompt": Prompt detallado para generar una imagen editorial de calidad estudio adecuada al tema (en inglés o español para el generador).

2. "twitter":
   - Publicación corta, afilada y directa (DEBE TENER MENOS DE 270 CARACTERES en total incluyendo hashtags).
   - Gancho potente o perspectiva contundente.
   - Ritmo ágil, sin palabras de relleno.
   - 1 o 2 hashtags clave.
   - "imagePrompt": Prompt para una imagen de alto impacto y contraste para el feed rápido de Twitter.

3. "instagram":
   - Pie de foto centrado en la narrativa visual.
   - Primera línea magnética antes del corte de "...más" de Instagram (menos de 125 caracteres).
   - Cuerpo de texto atractivo, con espaciado limpio y emojis bien seleccionados según el tono.
   - Llamada a la acción clara (ej. "Guarda este post", "Comparte con tu equipo", "Comenta tu experiencia").
   - 15 a 20 hashtags organizados por nicho y alcance.
   - "imagePrompt": Prompt para una imagen artística, cinematográfica o estética ideal para Instagram.

Responde estrictamente con un objeto JSON válido con esta estructura:
{
  "linkedin": {
    "hook": "string",
    "content": "string",
    "callToAction": "string",
    "hashtags": ["string"],
    "imagePrompt": "string"
  },
  "twitter": {
    "hook": "string",
    "content": "string",
    "callToAction": "string",
    "hashtags": ["string"],
    "imagePrompt": "string"
  },
  "instagram": {
    "hook": "string",
    "content": "string",
    "callToAction": "string",
    "hashtags": ["string"],
    "imagePrompt": "string"
  }
}`;

    const rawJsonText = await generateTextWithFallback(
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      prompt,
      {
        responseMimeType: 'application/json',
      }
    );

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawJsonText);
    } catch (parseError) {
      // Clean possible markdown code fences
      const cleaned = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Default optimal aspect ratios per platform
    const defaultAspectRatios: Record<string, string> = {
      linkedin: imageSettings.linkedinAspectRatio || '16:9',
      twitter: imageSettings.twitterAspectRatio || '16:9',
      instagram: imageSettings.instagramAspectRatio || '1:1',
    };

    const imageSize = imageSettings.size || '1K';
    const imageModel = imageSettings.model || 'gemini-3-pro-image-preview';

    // Build complete draft objects
    const formatPost = (platform: 'linkedin' | 'twitter' | 'instagram', data: any) => {
      const hashtagsStr = Array.isArray(data.hashtags)
        ? data.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
        : '';
      
      const fullText = `${data.content}\n\n${hashtagsStr}`.trim();

      return {
        platform,
        hook: data.hook || '',
        content: fullText,
        callToAction: data.callToAction || '',
        hashtags: Array.isArray(data.hashtags)
          ? data.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`))
          : [],
        characterCount: fullText.length,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        targetMaxCharacters: platform === 'twitter' ? 280 : undefined,
        imagePrompt: data.imagePrompt || `Modern visual representation of ${idea}`,
        imageConfig: {
          model: imageModel,
          size: imageSize,
          aspectRatio: defaultAspectRatios[platform] || '1:1',
          prompt: data.imagePrompt || `Modern visual representation of ${idea}`,
          status: 'idle',
        },
      };
    };

    const campaign = {
      id: `camp_${Date.now()}`,
      idea,
      tone,
      targetAudience,
      createdAt: new Date().toISOString(),
      posts: {
        linkedin: formatPost('linkedin', parsedData.linkedin),
        twitter: formatPost('twitter', parsedData.twitter),
        instagram: formatPost('instagram', parsedData.instagram),
      },
    };

    return res.json(campaign);
  } catch (error: any) {
    console.error('Error generating campaign:', error);
    return res.status(500).json({
      error: 'Failed to generate campaign',
      details: error.message,
    });
  }
});

// 2. Generate Image using Gemini Image Models
app.post('/api/generate-image', async (req, res) => {
  try {
    const {
      prompt,
      model = 'gemini-3-pro-image-preview',
      aspectRatio = '1:1',
      imageSize = '1K',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Supported aspect ratios check
    const supportedRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
    const validRatio = supportedRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    const validSize = ['1K', '2K', '4K'].includes(imageSize) ? imageSize : '1K';

    // Model candidate order: user chosen model, then fallback if needed
    const candidateModels = [
      model,
      model === 'gemini-3-pro-image-preview' ? 'gemini-3.1-flash-image-preview' : 'gemini-3-pro-image-preview',
      'gemini-3.1-flash-image',
    ];

    let lastError: any = null;
    let imageUrl = '';

    for (const currentModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: validRatio as any,
              imageSize: validSize as any,
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          return res.json({
            success: true,
            imageUrl,
            model: currentModel,
            aspectRatio: validRatio,
            imageSize: validSize,
          });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Image generation with ${currentModel} failed:`, err.message);
        // If 429 quota, don't necessarily thrash multiple times if quota is per-account
        if (err.message && err.message.includes('429')) {
          break;
        }
      }
    }

    const isQuota = lastError?.message?.includes('429') || lastError?.status === 429;

    return res.status(isQuota ? 429 : 500).json({
      success: false,
      error: isQuota
        ? 'Gemini Image Generation quota limit reached for this API key. Switch model or use the interactive canvas preview.'
        : lastError?.message || 'Failed to generate image',
      quotaExceeded: isQuota,
    });
  } catch (error: any) {
    console.error('Error in generate-image endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during image generation',
    });
  }
});

// 3. Fast Post Refinement (gemini-3.1-flash-lite)
app.post('/api/refine-post', async (req, res) => {
  try {
    const {
      content,
      platform,
      action,
      tone,
      customInstruction,
    } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    let instruction = '';
    switch (action) {
      case 'punchier':
        instruction =
          'Haz esta publicación mucho más contundente, directa y enérgica en español, eliminando palabras innecesarias. Mantén el mensaje central y el tono.';
        break;
      case 'shorten':
        instruction =
          platform === 'twitter'
            ? 'Acorta esta publicación en español de forma estricta para que todo el texto quede por debajo de 270 caracteres, haciendo que cada palabra cuente.'
            : 'Haz esta publicación en español aproximadamente un 30-40% más concisa sin perder valor ni aprendizajes clave.';
        break;
      case 'expand':
        instruction =
          'Expande esta publicación en español añadiendo ejemplos prácticos, viñetas estructuradas y mayor profundidad narrativa.';
        break;
      case 'cta':
        instruction =
          'Potencia la llamada a la acción (CTA) final en español para disparar los comentarios, interacciones o guardados.';
        break;
      case 're-tone':
        instruction = `Reescribe esta publicación en español transformando su tono a "${tone || 'witty'}" respetando las mejores prácticas de la plataforma.`;
        break;
      case 'hooks':
        const hooksPrompt = `Genera 5 ganchos iniciales alternativos, magnéticos y en IDIOMA ESPAÑOL para esta publicación de ${platform}.
Contenido actual:
"""${content}"""

Devuelve un array JSON de 5 strings en español, cada uno siendo un gancho de alta conversión:
["gancho 1", "gancho 2", "gancho 3", "gancho 4", "gancho 5"]`;

        const hooksResponse = await generateTextWithFallback(
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash',
          hooksPrompt,
          { responseMimeType: 'application/json' }
        );

        let hooksList: string[] = [];
        try {
          hooksList = JSON.parse(hooksResponse);
        } catch {
          hooksList = hooksResponse
            .split('\n')
            .map((l) => l.replace(/^[-*\d.)\s"]+|["]+$/g, '').trim())
            .filter(Boolean)
            .slice(0, 5);
        }
        return res.json({ hooks: hooksList });

      case 'custom':
      default:
        instruction = customInstruction || 'Mejora esta publicación en español para maximizar el engagement.';
        break;
    }

    const prompt = `Eres un editor y copywriter de redes sociales de clase mundial.
Tarea: ${instruction}
Plataforma: ${platform}
Idioma: Estrictamente en ESPAÑOL nativo y convincente.
Contenido original:
"""${content}"""

Reglas:
- Respeta los estándares de la plataforma (${platform === 'twitter' ? 'DEBE quedar en menos de 280 caracteres' : 'mantén una estructura limpia y espaciada'}).
- Entrega ÚNICAMENTE el texto final actualizado listo para publicar. Sin saludos, sin introducciones meta ni explicaciones.`;

    const refinedText = await generateTextWithFallback(
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      prompt
    );

    const cleanResult = refinedText.trim();

    return res.json({
      content: cleanResult,
      characterCount: cleanResult.length,
      wordCount: cleanResult.split(/\s+/).filter(Boolean).length,
    });
  } catch (error: any) {
    console.error('Error refining post:', error);
    return res.status(500).json({ error: error.message || 'Failed to refine post' });
  }
});

// 4. In-Depth Strategic Post Analysis (gemini-3.1-pro-preview with gemini-3.5-flash fallback)
app.post('/api/analyze-post', async (req, res) => {
  try {
    const { content, platform, tone } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `Eres un especialista ejecutivo en algoritmos de redes sociales y estratega de contenido.
Realiza una auditoría estratégica en profundidad sobre el siguiente borrador de publicación para ${platform} en IDIOMA ESPAÑOL.

Tono pretendido: ${tone || 'professional'}
Borrador de la publicación:
"""${content}"""

Analiza esto rigurosamente según los algoritmos actuales de la plataforma, la psicología de la viralidad y el poder para detener el scroll. Todos los textos, consejos y sugerencias deben estar en ESPAÑOL.

Devuelve un JSON válido que cumpla estrictamente con este formato:
{
  "platform": "${platform}",
  "engagementScore": 88,
  "viralityPotential": "Alta",
  "hookAnalysis": {
    "score": 9,
    "strengths": ["Curiosidad inicial inmediata", "Resonancia emocional clara"],
    "weaknesses": ["Podría anticipar el beneficio principal con mayor rapidez"],
    "suggestedHook": "Un gancho de 1 línea mejorado en español"
  },
  "pacingAndReadability": "Análisis de saltos de línea, ritmo y facilidad de lectura rápida...",
  "recommendedPostTime": "Mejor franja horaria recomendada (ej. Martes y jueves de 8:00 a 10:00 hora local)",
  "algorithmTips": [
    "Consejo 1 adaptado al alcance en la plataforma",
    "Consejo 2 adaptado a la velocidad de comentarios",
    "Consejo 3 adaptado al tiempo de permanencia (dwell time)"
  ]
}`;

    const analysisRaw = await generateTextWithFallback(
      'gemini-3.1-pro-preview',
      'gemini-3.5-flash',
      prompt,
      { responseMimeType: 'application/json' }
    );

    let parsedAnalysis: any;
    try {
      parsedAnalysis = JSON.parse(analysisRaw);
    } catch {
      const cleaned = analysisRaw.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedAnalysis = JSON.parse(cleaned);
    }

    return res.json(parsedAnalysis);
  } catch (error: any) {
    console.error('Error analyzing post:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze post' });
  }
});

// 5. Vocal Tuning & Dubbing Alignment AI Advisor
app.post('/api/vocal-ai-analysis', async (req, res) => {
  try {
    const { tracks } = req.body;

    const prompt = `Eres un ingeniero de sonido, productor vocal y director musical especializado en Melodyne, Auto-Tune, afinación de armonías y sincronización de doblaje en español.
Analiza la siguiente configuración de pistas vocales:
${JSON.stringify(tracks || [], null, 2)}

Genera una auditoría profesional sobre la afinación armónica, retune speed recomendado, escala musical óptima y consejos de sincronización temporal de doblaje.

Devuelve estrictamente un objeto JSON válido con esta estructura:
{
  "detectedKey": "C",
  "detectedScale": "major",
  "detectedBpm": 120,
  "pitchAccuracyScore": 92,
  "tuningRecommendations": [
    "Recomendación 1 para el tono y velocidad de retune",
    "Recomendación 2 para los formantes",
    "Recomendación 3 para el empaste de armonías"
  ],
  "dubbingTimingTips": [
    "Consejo 1 para sincronización labial y ataques",
    "Consejo 2 para estiramiento temporal de sílabas en español"
  ],
  "suggestedRetuneSpeed": 25
}`;

    const analysisRaw = await generateTextWithFallback(
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      prompt,
      { responseMimeType: 'application/json' }
    );

    let parsed: any;
    try {
      parsed = JSON.parse(analysisRaw);
    } catch {
      const cleaned = analysisRaw.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing vocals:', error);
    return res.status(500).json({ error: error.message || 'Error en auditoría vocal' });
  }
});

// Vite Middleware for Dev / Static in Prod
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OmniPost Server running at http://localhost:${PORT}`);
});
