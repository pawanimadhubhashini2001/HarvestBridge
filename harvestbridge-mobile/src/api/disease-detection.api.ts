import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface DiseaseDetectionImageAsset {
  uri: string;
  name: string;
  type: string;
}

export interface DiseasePredictionDto {
  disease_name: string;
  confidence: number;
  confidence_percentage: number;
  description: string;
  treatment_suggestions: string[];
  raw_response?: Record<string, unknown>;
}

export interface CachedDiseasePredictionResult {
  image: DiseaseDetectionImageAsset;
  source: 'camera' | 'gallery';
  submitted_at: string;
  response: DiseasePredictionDto;
}

function buildDiseaseDetectionFormData(image: DiseaseDetectionImageAsset) {
  const formData = new FormData();

  formData.append(
    'image',
    {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob,
  );

  return formData;
}

export function getLatestDiseasePredictionQueryKey() {
  return ['ai', 'disease-detection', 'latest'] as const;
}

export async function detectPlantDisease(image: DiseaseDetectionImageAsset) {
  const response = await apiClient.post<ApiSuccessResponse<DiseasePredictionDto>>(
    '/ai/disease-detect',
    buildDiseaseDetectionFormData(image),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}
