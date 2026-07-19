export const APP_CONFIG = {
  detectionConfidenceThreshold: 70,
  analyzingDelay: 1500,
  factsGenerationDelay: 1500,
  detectionRetryInterval: 100,
};

export const TONE_CONFIG = {
  availableTones: [
    { value: 'normal', label: 'Normal' },
    { value: 'funny', label: 'Lucu' },
    { value: 'professional', label: 'Profesional' },
    { value: 'casual', label: 'Santai' },
  ],
  defaultTone: 'normal',
};

export const isValidDetection = (result) => {
  const { detectionConfidenceThreshold } = APP_CONFIG;
  return Boolean(result && result.isValid && result.confidence >= detectionConfidenceThreshold);
};
