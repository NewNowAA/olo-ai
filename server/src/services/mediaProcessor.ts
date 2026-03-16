// =============================================
// Olo.AI — Media Processor
// =============================================
// Uses Gemini natively to process:
//  - Voice/audio → transcribe to text
//  - Images → describe / extract info (OCR-level)
//  - PDFs → extract readable text
//
// No external Whisper API needed — Gemini 2.0 Flash handles all.
// =============================================

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Shared model for media tasks (fast, multimodal)
function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

// --- Transcribe audio (voice message) ---
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const model = getModel();
    const base64 = audioBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: mimeType as any,
        },
      },
      'Transcreve o áudio em texto. Responde APENAS com o texto transcrito, sem comentários adicionais. Se não conseguires transcrever, responde com "[Áudio não compreendido]".',
    ]);

    const text = result.response.text().trim();
    return text || '[Áudio não compreendido]';
  } catch (error) {
    console.error('[MediaProcessor] transcribeAudio error:', error);
    return '[Erro ao processar áudio]';
  }
}

// --- Analyze image — describe or extract text/info ---
export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string,
  userCaption?: string
): Promise<string> {
  try {
    const model = getModel();
    const base64 = imageBuffer.toString('base64');

    const prompt = userCaption
      ? `O utilizador enviou uma imagem com a legenda: "${userCaption}". Descreve o conteúdo da imagem e responde à legenda do utilizador de forma útil. Se a imagem tiver texto, transcreve-o.`
      : 'Descreve o conteúdo desta imagem de forma detalhada e útil. Se contiver texto, transcreve-o. Se for um produto, menu, documento ou catálogo, extrai toda a informação relevante.';

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: mimeType as any,
        },
      },
      prompt,
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('[MediaProcessor] analyzeImage error:', error);
    return '[Erro ao analisar imagem]';
  }
}

// --- Extract text from PDF ---
export async function extractPdfText(
  pdfBuffer: Buffer,
  userCaption?: string
): Promise<string> {
  try {
    const model = getModel();
    const base64 = pdfBuffer.toString('base64');

    const prompt = userCaption
      ? `O utilizador enviou um PDF com o pedido: "${userCaption}". Extrai o conteúdo relevante do PDF e responde ao pedido.`
      : 'Extrai e resume todo o conteúdo de texto relevante deste PDF. Inclui títulos, preços, datas, nomes e qualquer informação estruturada.';

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: 'application/pdf' as any,
        },
      },
      prompt,
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('[MediaProcessor] extractPdfText error:', error);
    return '[Erro ao processar PDF]';
  }
}

// --- Generic document handler (routes by mime type) ---
export async function processDocument(
  buffer: Buffer,
  mimeType: string,
  caption?: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer, caption);
  }
  if (mimeType.startsWith('image/')) {
    return analyzeImage(buffer, mimeType, caption);
  }
  return '[Tipo de documento não suportado]';
}
