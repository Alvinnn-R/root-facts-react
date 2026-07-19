import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { isValidDetection, APP_CONFIG, MODEL_CONFIG } from '../utils/config.js';
import { isWebGPUSupported, logError, validateModelMetadata } from '../utils/common.js';

const { MODEL_PATH, METADATA_PATH } = MODEL_CONFIG.DETECTION;

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
    this.imageDimension = 224;
    this.activeBackend = null;
  }

  async loadModel(progressCallback) {
    try {
      if (isWebGPUSupported()) {
        try {
          await tf.setBackend('webgpu');
          await tf.ready();
          this.activeBackend = 'webgpu';
        } catch {
          await tf.setBackend('webgl');
          await tf.ready();
          this.activeBackend = 'webgl';
        }
      } else {
        await tf.setBackend('webgl');
        await tf.ready();
        this.activeBackend = 'webgl';
      }

      if (progressCallback) progressCallback(10);

      const [modelInstance, metaResponse] = await Promise.all([
        tf.loadLayersModel(MODEL_PATH),
        fetch(METADATA_PATH)
      ]);

      if (progressCallback) progressCallback(70);

      const metadataData = await metaResponse.json();

      if (!validateModelMetadata(metadataData)) {
        throw new Error('Metadata is missing the "labels" field.');
      }

      this.model = modelInstance;
      this.labels = metadataData.labels;
      this.imageDimension = metadataData.imageSize || 224;

      tf.tidy(() => {
        const warmupTensor = tf.zeros([1, this.imageDimension, this.imageDimension, 3]);
        this.model.predict(warmupTensor);
      });

      if (progressCallback) progressCallback(100);

      return { backend: this.activeBackend, labels: this.labels };
    } catch (err) {
      logError('DetectionService: model loading failed', err);
      throw err;
    }
  }

  async predict(imageSource) {
    if (!this.isLoaded()) return null;

    let predictionData = null;

    try {
      predictionData = tf.tidy(() => {
        const tensorObj = tf.browser.fromPixels(imageSource)
          .resizeBilinear([this.imageDimension, this.imageDimension])
          .toFloat()
          .div(tf.scalar(255))
          .expandDims(0);

        const resultTensor = this.model.predict(tensorObj);
        return resultTensor.dataSync();
      });

      let highestIndex = 0;
      for (let i = 1; i < predictionData.length; i++) {
        if (predictionData[i] > predictionData[highestIndex]) {
          highestIndex = i;
        }
      }

      const confPercentage = Math.round(predictionData[highestIndex] * 100);
      const recognizedLabel = this.labels[highestIndex] || 'Unknown';

      return {
        className: recognizedLabel,
        label: recognizedLabel,
        confidence: confPercentage,
        score: predictionData[highestIndex],
        isValid: confPercentage >= APP_CONFIG.detectionConfidenceThreshold,
      };
    } catch (err) {
      logError('DetectionService: prediction failed', err);
      return null;
    }
  }

  isLoaded() {
    return Boolean(this.model && this.labels.length > 0);
  }

  getBackend() {
    return this.activeBackend;
  }
}
