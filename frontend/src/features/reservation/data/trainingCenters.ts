import trainingCenterData from './trainingCenters.generated.json';

export type TrainingCenterStatus = 'Active' | 'Reserved' | 'Closed';

export interface TrainingCenter {
  id: string;
  name: string;
  sido: string;
  zone: string;
  zones: string[];
  aliases: string[];
  sourceCount: number;
  address: string;
  phone: string;
  status: TrainingCenterStatus;
  lat: number;
  lng: number;
  markerLabel: string;
  distance?: number;
}

export const TRAINING_CENTERS = trainingCenterData as TrainingCenter[];
