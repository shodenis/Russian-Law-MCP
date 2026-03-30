/**
 * get_provision_eu_basis — Get EU legal basis for a specific provision.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

function normalizeProvisionRefLocal(ref: string): string {
  const trimmed = ref.trim();
  const pStMatch = trimmed.match(/[пП](?:ункт)?\.?\s*(\d+)\s*[сС]т(?:атья|\.|\s)\s*(\d+(?:\.\d+)?)/);
  if (pStMatch) return `${pStMatch[2]}:${pStMatch[1]}`;
  const chStMatch = trimmed.match(/[чЧ](?:асть)?\.?\s*(\d+)\s*[сС]т(?:атья|\.|\s)\s*(\d+(?:\.\d+)?)/);
  if (chStMatch) return `${chStMatch[2]}:${chStMatch[1]}`;
  const stMatch = trimmed.match(/[сС]т(?:атья|\.|\s)\s*(\d+(?:\.\d+)?)/);
  if (stMatch) return stMatch[1];
  return trimmed;
}

export interface GetProvisionEUBasisInput {
  document_id: string;
  provision_ref: string;
}

interface ProvisionEUReference {
  id: string;
  type: 'directive' | 'regulation';
  title?: string;
  short_name?: string;
  article?: string;
  reference_type: string;
  full_citation: string;
  context?: string;
}

export interface GetProvisionEUBasisResult {
  document_id: string;
  provision_ref: string;
  provision_content?: string;
  eu_references: ProvisionEUReference[];
}

export async function getProvisionEUBasis(
  db: Database,
  input: GetProvisionEUBasisInput
): Promise<ToolResponse<GetProvisionEUBasisResult>> {
  if (!input.document_id) throw new Error('document_id is required');
  if (!input.provision_ref || !input.provision_ref.trim()) throw new Error('provision_ref is required');

  let resolvedDocId = input.document_id;
  let docRow = db.prepare(`SELECT id FROM laws WHERE id = ?`).get(input.document_id) as { id: string } | undefined;
  if (!docRow) {
    docRow = db.prepare(`SELECT id FROM laws WHERE identifier = ? OR id LIKE ? OR identifier LIKE ? LIMIT 1`).get(input.document_id, `%${input.document_id}%`, `%${input.document_id}%`) as typeof docRow;
  }
  if (docRow) resolvedDocId = docRow.id;

  const normalizedRef = normalizeProvisionRefLocal(input.provision_ref);

  const provision = db.prepare(`SELECT id, content FROM provisions WHERE law_id = ? AND (provision_ref = ? OR provision_ref = ?)`).get(resolvedDocId, input.provision_ref, normalizedRef) as { id: number; content: string } | undefined;

  if (!provision) throw new Error(`Provision ${input.document_id} ${input.provision_ref} not found in database`);

  try {
    const sql = `SELECT ed.id, ed.type, ed.title, ed.short_name, er.eu_article, er.reference_type, er.full_citation, er.reference_context FROM eu_documents ed JOIN eu_references er ON ed.id = er.eu_document_id WHERE er.provision_id = ? ORDER BY CASE er.reference_type WHEN 'implements' THEN 1 WHEN 'supplements' THEN 2 WHEN 'cites_article' THEN 3 ELSE 4 END, ed.year DESC`;

    interface QueryRow { id: string; type: 'directive' | 'regulation'; title: string | null; short_name: string | null; eu_article: string | null; reference_type: string; full_citation: string | null; reference_context: string | null; }

    const rows = db.prepare(sql).all(provision.id) as QueryRow[];

    const euReferences: ProvisionEUReference[] = rows.map(row => {
      const ref: ProvisionEUReference = { id: row.id, type: row.type, reference_type: row.reference_type, full_citation: row.full_citation || row.id };
      if (row.title) ref.title = row.title;
      if (row.short_name) ref.short_name = row.short_name;
      if (row.eu_article) ref.article = row.eu_article;
      if (row.reference_context) ref.context = row.reference_context;
      return ref;
    });

    return { results: { document_id: input.document_id, provision_ref: input.provision_ref, provision_content: provision.content, eu_references: euReferences }, _metadata: generateResponseMetadata(db) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table')) {
      return { results: { message: 'EU cross-reference data is not yet populated for Russian law. This feature will be available in a future update.' }, _metadata: generateResponseMetadata(db) } as unknown as ToolResponse<GetProvisionEUBasisResult>;
    }
    throw err;
  }
}