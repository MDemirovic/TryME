import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';

import type { StudyDocument } from '@/src/types';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const DOC_MIME = 'application/msword';
const TEXT_MIME = 'text/plain';

function createDocumentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n')
    .replace(/&#160;/g, ' ');
}

function cleanExtractedText(input: string): string {
  return input
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u0000/g, '')
    .trim();
}

function extractTextFromDocumentXml(xml: string): string {
  const paragraphs = xml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];

  const parsedParagraphs = paragraphs
    .map((paragraph) => {
      const runs = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
      const text = runs.map((run) => decodeEntities(run[1])).join('').trim();
      return text;
    })
    .filter(Boolean);

  if (parsedParagraphs.length > 0) {
    return parsedParagraphs.join('\n\n');
  }

  const fallbackRuns = [...xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
  return fallbackRuns
    .map((run) => decodeEntities(run[1]))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function parseDocxFromUri(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64, { base64: true });
  const documentXml = await zip.file('word/document.xml')?.async('string');

  if (!documentXml) {
    throw new Error('The selected DOCX file does not contain readable text content.');
  }

  const text = cleanExtractedText(extractTextFromDocumentXml(documentXml));
  if (!text) {
    throw new Error('No usable text was found in your DOCX notes.');
  }
  return text;
}

function extractReadableChunks(raw: string): string {
  const decoded = raw
    .replace(/\\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ');

  const pdfStyled = [...decoded.matchAll(/\(([^()]{4,220})\)/g)].map((match) => match[1].trim());
  const generic = decoded.match(/[A-Za-z0-9][A-Za-z0-9 ,.;:()\-_'"/\\!?]{8,220}/g) ?? [];

  const merged = [...pdfStyled, ...generic]
    .map((entry) => entry.replace(/\s{2,}/g, ' ').trim())
    .filter((entry) => entry.length >= 8);

  const unique: string[] = [];
  merged.forEach((entry) => {
    if (!unique.includes(entry)) {
      unique.push(entry);
    }
  });

  return cleanExtractedText(unique.join('\n'));
}

async function parseTextLikeFromUri(uri: string, kind: 'pdf' | 'doc' | 'txt'): Promise<string> {
  const raw = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (kind === 'txt') {
    const text = cleanExtractedText(raw);
    if (!text) {
      throw new Error('The selected text file is empty.');
    }
    return text;
  }

  const extracted = extractReadableChunks(raw);
  if (extracted.length < 120) {
    throw new Error(
      `The selected ${kind.toUpperCase()} file could not be read cleanly on-device. Please paste the notes as plain text in Create.`,
    );
  }

  return extracted;
}

function resolveFileType(fileName: string): StudyDocument['fileType'] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.docx')) {
    return 'docx';
  }
  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }
  if (lower.endsWith('.doc')) {
    return 'doc';
  }
  if (lower.endsWith('.txt')) {
    return 'txt';
  }
  return 'text';
}

export async function pickStudyDocument(): Promise<StudyDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [DOCX_MIME, PDF_MIME, DOC_MIME, TEXT_MIME],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return null;
  }

  const file = result.assets[0];
  const fileType = resolveFileType(file.name);

  if (fileType === 'text') {
    throw new Error('Supported file types are .docx, .pdf, .doc, and .txt.');
  }

  let extractedText = '';
  if (fileType === 'docx') {
    extractedText = await parseDocxFromUri(file.uri);
  } else {
    extractedText = await parseTextLikeFromUri(file.uri, fileType);
  }

  return {
    id: createDocumentId(),
    name: file.name,
    uri: file.uri,
    extractedText,
    uploadedAt: new Date().toISOString(),
    sourceType: 'file',
    fileType,
  };
}

export function createPastedStudyDocument(input: string): StudyDocument {
  const text = cleanExtractedText(input);
  if (text.length < 30) {
    throw new Error('Please paste at least a few sentences so the examiner can generate useful questions.');
  }

  return {
    id: createDocumentId(),
    name: `Pasted notes ${new Date().toLocaleString()}`,
    uri: 'pasted://notes',
    extractedText: text,
    uploadedAt: new Date().toISOString(),
    sourceType: 'paste',
    fileType: 'text',
  };
}
