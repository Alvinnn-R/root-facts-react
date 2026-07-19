import { pipeline } from '@huggingface/transformers';
import { TONE_CONFIG, MODEL_CONFIG, TONE_INSTRUCTIONS, BACKUP_FACTS } from '../utils/config.js';
import { logError } from '../utils/common.js';

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  async loadModel(onProgressCallback) {
    try {
      this.currentBackend = 'wasm';

      if (onProgressCallback) onProgressCallback(5);

      this.generator = await pipeline(
        'text2text-generation',
        MODEL_CONFIG.GENERATIVE.MODEL_NAME,
        {
          dtype: MODEL_CONFIG.GENERATIVE.DTYPE,
          device: this.currentBackend,
          progress_callback: (info) => {
            if (info && typeof info.progress === 'number') {
              onProgressCallback && onProgressCallback(Math.min(99, Math.round(info.progress)));
            }
          },
        }
      );

      this.isModelLoaded = true;
      if (onProgressCallback) onProgressCallback(100);

      return { backend: this.currentBackend };
    } catch (err) {
      logError('RootFactsService: Model loading failed', err);
      throw err;
    }
  }

  setTone(newTone) {
    const validTones = TONE_CONFIG.availableTones.map((t) => t.value);
    if (validTones.includes(newTone)) {
      this.currentTone = newTone;
    }
  }

  checkFactValidity(factText, vegetableLabel) {
    if (!factText || factText.length < 15) return false;

    const lowerFact = factText.toLowerCase();
    const lowerVeg = vegetableLabel.toLowerCase();

    const strippedVeg = lowerVeg.replace(/[^a-z]/g, '');
    const containsVeg = lowerFact.includes(strippedVeg) || strippedVeg.includes(lowerFact);
    if (!containsVeg) return false;

    const forbiddenWords = [
      'football', 'soccer', 'team', 'game', 'sport', 'play', 'match', 'club', 'league',
      'fish', 'ocean', 'sea', 'river', 'lake', 'swimming', 'swam', 'water for millions of years',
      'animal', 'mammal', 'bird', 'reptile', 'insect', 'dog', 'cat', 'car', 'vehicle'
    ];

    if (forbiddenWords.some((word) => lowerFact.includes(word))) {
      return false;
    }

    const contextKeywords = [
      'vegetable', 'plant', 'crop', 'eat', 'food', 'cook', 'taste', 'grow', 'root', 'seed',
      'herb', 'ingredient', 'culinary', 'dish', 'vitamin', 'nutrient', 'healthy', 'bean',
      'fruit', 'leaf', 'leaves', 'tuber', 'bulb', 'spice', 'flavor', 'nature',
      'garden', 'farm', 'agriculture', 'harvest', 'recipe', 'diet', 'protein', 'source',
      'fat', 'oil', 'water', 'mineral', 'iron', 'calcium', 'potassium', 'fiber', 'sodium',
      'carbohydrate', 'calorie', 'cultivate', 'origin', 'native', 'ancient', 'history',
      'traditional', 'medicine', 'health', 'benefit', 'wild', 'species'
    ];

    return contextKeywords.some((word) => lowerFact.includes(word));
  }

  async generateFacts(vegetableName) {
    if (!this.isReady() || this.isGenerating) return null;
    this.isGenerating = true;

    try {
      const template = TONE_INSTRUCTIONS[this.currentTone] || TONE_INSTRUCTIONS.normal;
      const finalPrompt = template.replace(/{vegetable}/g, vegetableName);

      let finalFact = null;
      let attemptCount = 0;

      const generationParams = MODEL_CONFIG.GENERATIVE.PARAMS;

      while (attemptCount < 3) {
        const p = generationParams[attemptCount];

        const pipelineOutput = await this.generator(finalPrompt, {
          max_new_tokens: MODEL_CONFIG.GENERATIVE.MAX_NEW_TOKENS,
          temperature: p.temperature,
          top_p: p.top_p,
          do_sample: p.do_sample,
          repetition_penalty: 1.2,
        });

        const generatedData =
          pipelineOutput?.[0]?.generated_text?.trim() ||
          pipelineOutput?.[0]?.translation_text?.trim() ||
          null;

        if (generatedData && this.checkFactValidity(generatedData, vegetableName)) {
          finalFact = generatedData;
          break;
        }
        attemptCount++;
      }

      if (!finalFact) {
        finalFact =
          BACKUP_FACTS[vegetableName]?.[this.currentTone] ||
          BACKUP_FACTS[vegetableName]?.normal ||
          `Here is an interesting thought about ${vegetableName}: it is a very nutritious crop enjoyed globally!`;
      }

      return finalFact;
    } catch (err) {
      logError('RootFactsService: generation error', err);
      return (
        BACKUP_FACTS[vegetableName]?.[this.currentTone] ||
        BACKUP_FACTS[vegetableName]?.normal ||
        `It is widely known that ${vegetableName} is full of beneficial nutrients.`
      );
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && this.generator !== null;
  }

  getBackend() {
    return this.currentBackend;
  }
}
