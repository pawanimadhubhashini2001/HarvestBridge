import { apiClient } from '@/api/apiClient';
import type { RecommendationReportPayload } from '@/api/recommendation.api';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface DownloadRecommendationPdfOptions {
  fileName?: string;
  shouldSaveToDevice?: boolean;
  onProgress?: (progress: number | null) => void;
}

export interface SavedRecommendationPdf {
  fileName: string;
  uri: string;
  mimeType: 'application/pdf';
  source: 'native-file' | 'web-object-url';
}

function sanitizeFileSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function buildRecommendationPdfFileName(
  cropName: string,
  submittedAt: string,
) {
  const cropSegment = sanitizeFileSegment(cropName) || 'recommendation';
  const date = new Date(submittedAt);
  const dateSegment = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);

  return `recommendation-${cropSegment}-${dateSegment}.pdf`;
}

function resolveProgress(loaded: number, total?: number) {
  if (!total || total <= 0) {
    return null;
  }

  return Math.max(0, Math.min(1, loaded / total));
}

function ensureReportsDirectory() {
  const reportsDirectory = new Directory(Paths.document, 'reports');

  if (!reportsDirectory.exists) {
    reportsDirectory.create({
      idempotent: true,
      intermediates: true,
    });
  }

  return reportsDirectory;
}

export async function downloadRecommendationPdf(
  payload: RecommendationReportPayload,
  options: DownloadRecommendationPdfOptions = {},
): Promise<SavedRecommendationPdf> {
  const fileName =
    options.fileName ??
    buildRecommendationPdfFileName(
      payload.prediction.recommended_crop,
      new Date().toISOString(),
    );

  const response = await apiClient.post(
    '/reports/recommendation',
    payload,
    {
      responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
      headers: {
        Accept: 'application/pdf',
      },
      onDownloadProgress: (event) => {
        options.onProgress?.(resolveProgress(event.loaded, event.total));
      },
    },
  );

  if (Platform.OS === 'web') {
    const blob = response.data as Blob;
    const objectUrl = window.URL.createObjectURL(blob);

    if (options.shouldSaveToDevice !== false) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return {
      fileName,
      uri: objectUrl,
      mimeType: 'application/pdf',
      source: 'web-object-url',
    };
  }

  const reportsDirectory = ensureReportsDirectory();
  const pdfFile = new File(reportsDirectory, fileName);

  if (pdfFile.exists) {
    pdfFile.delete();
  }

  pdfFile.create({
    intermediates: true,
    overwrite: true,
  });
  pdfFile.write(new Uint8Array(response.data as ArrayBuffer));

  return {
    fileName,
    uri: pdfFile.uri,
    mimeType: 'application/pdf',
    source: 'native-file',
  };
}

export async function openRecommendationPdf(pdf: SavedRecommendationPdf) {
  if (Platform.OS === 'web') {
    window.open(pdf.uri, '_blank', 'noopener,noreferrer');
    return;
  }

  const file = new File(pdf.uri);

  if (!file.exists) {
    throw new Error('The PDF file is no longer available on this device.');
  }

  const targetUri = Platform.OS === 'android' ? file.contentUri : file.uri;

  await Linking.openURL(targetUri);
}

export async function shareRecommendationPdf(pdf: SavedRecommendationPdf) {
  if (Platform.OS === 'web') {
    throw new Error('PDF sharing is not available on web in this build.');
  }

  const isSharingAvailable = await Sharing.isAvailableAsync();

  if (!isSharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const file = new File(pdf.uri);

  if (!file.exists) {
    throw new Error('Download the PDF again before sharing it.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share recommendation report',
    UTI: 'com.adobe.pdf',
  });
}
