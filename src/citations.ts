import type { CitationDetails } from './utils/types.js';

/**
 * Parses raw citation strings for legal references.
 *
 * Supports formats like:
 * - "152-ФЗ"          → federal law number
 * - "Статья 252"      → article reference
 * - "Статья 252, часть 1" → article with part
 * - "Статья 168, пункт 3" → article with paragraph
 * - "Статья 252 НК РФ" → article with code name
 * - "ст. 252 НК РФ"   → short article with code
 * - "Статья 3 152-ФЗ" → article of federal law
 * - "ст. 3 152-ФЗ"    → short article of federal law
 * - "Конституция РФ"   → constitution reference
 * - "Часть II НК РФ"  → code volume reference
 * - "Глава 23 НК РФ"  → chapter with document
 * - "5.3 КоАП РФ"     → code article with section
 */

// Patterns
const FEDERAL_LAW_PATTERN = /^(\d+)-ФЗ$/i;
const CONSTITUTION_PATTERN = /[Кк]онституция\s+(?:РФ|Российской\s+Федерации)/i;
const CODE_VOLUME_PATTERN = /[Чч]асть\s+([IVX]+|[\d]+)\s*(?:(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ)?/i;
const CHAPTER_PATTERN = /[Гг]л(?:ава|\.|\s)\s*(\d+)/i;
const CHAPTER_WITH_DOC_PATTERN = /[Гг]л(?:ава|\.|\s)\s*(\d+)\s+(?:(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ)/i;
const SECTION_PATTERN = /[Рр]азд(?:ел|\.|\s)\s*(\d+)/i;
const ARTICLE_WITH_PART_PATTERN = /[Сс]татья\s+(\d+(?:\.\d+)?)\s*,\s*часть\s+(\d+)(?:\s+(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ)?/i;
const ARTICLE_WITH_PARAGRAPH_PATTERN = /[Сс]татья\s+(\d+(?:\.\d+)?)\s*,\s*пункт\s+(\d+)(?:\s+(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ)?/i;
const ARTICLE_WITH_DOC_PATTERN = /[Сс]татья\s+(\d+(?:\.\d+)?)\s+(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ/i;
const ARTICLE_WITH_FZ_PATTERN = /[Сс]татья\s+(\d+(?:\.\d+)?)\s+(?:\S*-ФЗ|\S*-ФКЗ)/i;
const SHORT_ARTICLE_WITH_DOC_PATTERN = /[сС]т\.?\s+(\d+(?:\.\d+)?)\s+(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ/i;
const SHORT_ARTICLE_WITH_FZ_PATTERN = /[сС]т\.?\s+(\d+(?:\.\d+)?)\s+(?:\S*-ФЗ|\S*-ФКЗ)/i;
const SHORT_ARTICLE_PATTERN = /[сС]т\.?\s+(\d+(?:\.\d+)?)/i;
const ARTICLE_PATTERN = /[Сс]татья\s+(\d+(?:\.\d+)?)/i;

const CODE_ABBREVIATIONS: Record<string, string> = {
  'НК РФ': 'Налоговый кодекс',
  'ГК РФ': 'Гражданский кодекс',
  'ТК РФ': 'Трудовой кодекс',
  'ЖК РФ': 'Жилищный кодекс',
  'ЗК РФ': 'Земельный кодекс',
  'СК РФ': 'Семейный кодекс',
  'УК РФ': 'Уголовный кодекс',
  'КоАП РФ': 'Кодекс об административных правонарушениях',
  'УПК РФ': 'Уголовно-процессуальный кодекс',
  'ГПК РФ': 'Гражданский процессуальный кодекс',
  'АПК РФ': 'Арбитражный процессуальный кодекс',
  'БК РФ': 'Бюджетный кодекс',
  'ЛК РФ': 'Лесной кодекс',
  'ВК РФ': 'Водный кодекс',
};

function extractDocTitle(citation: string): string | undefined {
  for (const [abbr, full] of Object.entries(CODE_ABBREVIATIONS)) {
    if (citation.includes(abbr)) return full;
  }
  if (/конституция\s+(?:РФ|Российской\s+Федерации)/i.test(citation)) {
    return 'Конституция Российской Федерации';
  }
  const fzMatch = citation.match(/(\d+-Ф(?:З|КЗ))/i);
  if (fzMatch) return fzMatch[1];
  return undefined;
}

function extractLawNumber(citation: string): string | undefined {
  const fzMatch = citation.match(/(\d+-Ф(?:З|КЗ))/i);
  return fzMatch ? fzMatch[1] : undefined;
}

export function parseCitation(raw: string): CitationDetails {
  raw = raw.trim();

  if (CONSTITUTION_PATTERN.test(raw)) {
    return { raw, type: 'constitution', valid: true };
  }

  let match = raw.match(FEDERAL_LAW_PATTERN);
  if (match) {
    return { raw, type: 'federal_law', number: match[1], valid: true };
  }

  match = raw.match(CODE_VOLUME_PATTERN);
  if (match) {
    const title = extractDocTitle(raw);
    return { raw, type: 'code_volume', volume: match[1], ...(title && { title }), valid: true };
  }

  match = raw.match(CHAPTER_WITH_DOC_PATTERN);
  if (match) {
    const title = extractDocTitle(raw);
    return { raw, type: 'chapter', chapter: match[1], ...(title && { title }), valid: true };
  }

  match = raw.match(CHAPTER_PATTERN);
  if (match) {
    return { raw, type: 'chapter', chapter: match[1], valid: true };
  }

  match = raw.match(SECTION_PATTERN);
  if (match) {
    return { raw, type: 'section', section: match[1], valid: true };
  }

  match = raw.match(ARTICLE_WITH_PART_PATTERN);
  if (match) {
    const title = extractDocTitle(raw);
    return { raw, type: 'article', article: match[1], part: match[2], ...(title && { title }), valid: true };
  }

  match = raw.match(ARTICLE_WITH_PARAGRAPH_PATTERN);
  if (match) {
    const title = extractDocTitle(raw);
    return { raw, type: 'article', article: match[1], paragraph: match[2], ...(title && { title }), valid: true };
  }

  match = raw.match(ARTICLE_WITH_DOC_PATTERN);
  if (match) {
    const articleNum = raw.match(/[Сс]татья\s+(\d+(?:\.\d+)?)/)?.[1];
    const title = extractDocTitle(raw);
    return { raw, type: 'article', article: articleNum ?? match[1], ...(title && { title }), valid: true };
  }

  match = raw.match(ARTICLE_WITH_FZ_PATTERN);
  if (match) {
    const lawNumber = extractLawNumber(raw);
    return { raw, type: 'article', article: match[1], ...(lawNumber && { number: lawNumber, title: lawNumber }), valid: true };
  }

  match = raw.match(SHORT_ARTICLE_WITH_DOC_PATTERN);
  if (match) {
    const title = extractDocTitle(raw);
    return { raw, type: 'article', article: match[1], ...(title && { title }), valid: true };
  }

  match = raw.match(SHORT_ARTICLE_WITH_FZ_PATTERN);
  if (match) {
    const lawNumber = extractLawNumber(raw);
    return { raw, type: 'article', article: match[1], ...(lawNumber && { number: lawNumber, title: lawNumber }), valid: true };
  }

  match = raw.match(SHORT_ARTICLE_PATTERN);
  if (match) {
    return { raw, type: 'article', article: match[1], valid: true };
  }

  match = raw.match(ARTICLE_PATTERN);
  if (match) {
    return { raw, type: 'article', article: match[1], valid: true };
  }

  return { raw, type: 'unknown', valid: false, error: 'Unrecognized citation format' };
}

export function formatCitation(details: CitationDetails, format: 'full' | 'short' | 'pinpoint'): string {
  if (details.type === 'unknown') return details.raw;

  if (details.type === 'constitution') {
    switch (format) {
      case 'full': return 'Конституция Российской Федерации';
      case 'short': return 'Конституция РФ';
      case 'pinpoint': return 'Конституция РФ';
    }
  }

  if (details.type === 'federal_law' && details.number) {
    const title = `Федеральный закон от ... года N ${details.number}-ФЗ`;
    switch (format) {
      case 'full': return title;
      case 'short': return `${details.number}-ФЗ`;
      case 'pinpoint': return `${details.number}-ФЗ`;
    }
  }

  if (details.type === 'article') {
    const articleNum = details.article;
    switch (format) {
      case 'full': return `Статья ${articleNum}`;
      case 'short': return `ст. ${articleNum}`;
      case 'pinpoint':
        if (details.part) return `Статья ${articleNum}, часть ${details.part}`;
        if (details.paragraph) return `Статья ${articleNum}, пункт ${details.paragraph}`;
        return `Статья ${articleNum}`;
    }
  }

  if (details.type === 'chapter' && details.chapter) {
    switch (format) {
      case 'full': return `Глава ${details.chapter}`;
      case 'short': return `гл. ${details.chapter}`;
      case 'pinpoint': return `Глава ${details.chapter}`;
    }
  }

  if (details.type === 'code_volume' && details.volume) {
    switch (format) {
      case 'full': return `Часть ${details.volume}`;
      case 'short': return `ч. ${details.volume}`;
      case 'pinpoint': return `Часть ${details.volume}`;
    }
  }

  return details.raw;
}

export function extractSentencesFromText(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
}

export function extractCitationsFromText(text: string): string[] {
  const citations: string[] = [];
  const lawMatches = text.match(/\b(\d+)-ФЗ\b/g);
  if (lawMatches) citations.push(...lawMatches);
  if (CONSTITUTION_PATTERN.test(text)) citations.push('Конституция РФ');
  const articleMatches = text.match(/[Сс]татья\s+\d+(?:\.\d+)?(?:\s*,\s*(?:часть|пункт)\s+\d+)?(?:\s+(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ)?/g);
  if (articleMatches) citations.push(...articleMatches);
  const shortArticleMatches = text.match(/[сС]т\.?\s+\d+(?:\.\d+)?(?:\s+(?:НК|ГК|ТК|ЖК|ЗК|СК|УК|КоАП)\s*РФ|\s+\d+-Ф(?:З|КЗ))?/g);
  if (shortArticleMatches) citations.push(...shortArticleMatches);
  return citations;
}
