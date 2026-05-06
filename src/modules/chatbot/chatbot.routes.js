/**
 * AI Help Chatbot  (Phase 5)
 *
 * Simple RAG (Retrieval-Augmented Generation) chatbot that:
 *  1. Searches CMS articles/FAQs for relevant chunks
 *  2. Calls Claude API with the retrieved context + user question
 *  3. Returns the AI answer + source articles (citations)
 *
 * This is a lightweight implementation using keyword search against
 * the cms_articles collection. In production, swap to Meilisearch
 * (Phase 6) for better retrieval.
 *
 * Rate-limited to 10 messages/min per user.
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { getMeili, isMeiliReady } from '../../config/meilisearch.js';

const r = Router();
const articlesCol = () => getDb().collection('cms_articles');
const faqsCol = () => getDb().collection('cms_content');

const CHATBOT_RATE_LIMIT = 10; // messages per minute per user

/* ─── Retrieval — Meilisearch (preferred) or keyword fallback ── */
async function retrieveContext(question, lang = 'en', limit = 3) {
  // Meilisearch path (Phase 6)
  if (isMeiliReady()) {
    try {
      const result = await getMeili().index('articles').search(question, {
        filter: `status = "published" AND lang = "${lang}"`,
        limit,
        attributesToRetrieve: ['_id', 'title', 'content', 'slug'],
      });
      if (result.hits.length > 0) {
        return result.hits.map((h) => ({ type: 'article', title: h.title, content: (h.content || '').slice(0, 600), slug: h.slug }));
      }
    } catch {
      // fall through to keyword search
    }
  }

  // Keyword fallback
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'how', 'what', 'why', 'when', 'where', 'can', 'i', 'my', 'do', 'does', 'to', 'of', 'in', 'for', 'on', 'with']);
  const keywords = question
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  if (keywords.length === 0) return [];

  const regexes = keywords.map((k) => new RegExp(k, 'i'));
  // MongoDB applies regex to each array element directly — $elemMatch not needed here
  const orCondition = regexes.map((r) => ({
    $or: [{ title: r }, { content: r }, { tags: r }],
  }));

  const articles = await articlesCol().find({
    $and: orCondition,
    status: 'published',
    lang,
  }).limit(limit).project({ title: 1, content: 1, slug: 1 }).toArray();

  const faqDoc = await faqsCol().findOne({ key: 'faqs' });
  const matchingFaqs = (faqDoc?.items || []).filter((faq) =>
    keywords.some((k) => (faq.question || '').toLowerCase().includes(k) || (faq.answer || '').toLowerCase().includes(k)),
  ).slice(0, 2);

  return [
    ...articles.map((a) => ({ type: 'article', title: a.title, content: a.content?.slice(0, 600) || '', slug: a.slug })),
    ...matchingFaqs.map((f) => ({ type: 'faq', title: f.question, content: f.answer || '' })),
  ];
}

/* ─── Claude API call ────────────────────────────────────────── */
async function callClaude(question, context, lang = 'en') {
  if (!env.ANTHROPIC_API_KEY) {
    // Fallback: return a curated no-AI response with sources
    return {
      answer: "I found some relevant articles that may help. Please check the sources below.",
      model: 'fallback',
    };
  }

  const contextText = context.length
    ? context.map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`).join('\n\n')
    : 'No specific documentation found.';

  const systemPrompt = `You are a helpful customer support assistant for QuickHire, a platform that connects customers with professional service providers. Answer the user's question using ONLY the provided context. If the context doesn't contain enough information, say so honestly and suggest contacting support. Be concise (under 150 words). Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Context:\n${contextText}\n\nQuestion: ${question}` }],
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    logger.warn({ status: response.status, err }, 'claude api error');
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    answer: data.content?.[0]?.text || 'Sorry, I could not generate an answer.',
    model: data.model,
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
  };
}

/* ─── Chat endpoint ──────────────────────────────────────────── */
r.post('/message', validate(z.object({
  message: z.string().min(1).max(500),
  lang: z.string().default('en'),
  sessionId: z.string().optional(),
})), asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.ip;

  // Rate limiting
  const rlKey = `chatbot:rl:${userId}`;
  const count = await redis.incr(rlKey).catch(() => 0);
  if (count === 1) await redis.expire(rlKey, 60).catch(() => {});
  if (count > CHATBOT_RATE_LIMIT) {
    throw new AppError('RATE_LIMITED', 'Too many chatbot messages. Please wait a minute.', 429);
  }

  const { message, lang } = req.body;

  // Retrieve relevant context
  const context = await retrieveContext(message, lang, 3);

  // Call AI
  let aiResponse;
  try {
    aiResponse = await callClaude(message, context, lang);
  } catch (err) {
    logger.warn({ err }, 'chatbot ai call failed, using fallback');
    aiResponse = {
      answer: context.length
        ? 'Here are some articles that may help. Please review the sources below.'
        : "I couldn't find specific information about this. Please contact our support team at support@quickhire.in.",
      model: 'fallback',
    };
  }

  // Log interaction (for training / quality review)
  await getDb().collection('chatbot_logs').insertOne({
    userId,
    message,
    lang,
    contextCount: context.length,
    answer: aiResponse.answer,
    model: aiResponse.model,
    createdAt: new Date(),
  }).catch(() => {});

  res.json({ success: true, data: {
    answer: aiResponse.answer,
    sources: context.map((c) => ({ title: c.title, slug: c.slug, type: c.type })),
    sessionId: req.body.sessionId,
  }});
}));

// GET /api/chatbot/suggested — common questions for the chat UI
r.get('/suggested', asyncHandler(async (req, res) => {
  const suggestions = [
    'How do I track my booking?',
    'Can I reschedule my booking?',
    'What is the cancellation policy?',
    'How do I contact my project manager?',
    'When will I receive my invoice?',
    'How do I add more services to my booking?',
  ];
  res.json({ success: true, data: suggestions });
}));

export default r;
