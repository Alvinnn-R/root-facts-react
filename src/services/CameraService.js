import { getCameraErrorMessage, logError } from '../utils/common.js';

export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
    this.currentFps = 30;
    this.frameDelay = 1000 / 30;
    this.previousFrameTime = 0;
    this.cameraList = [];
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  async loadCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Akses mediaDevices tidak didukung (pastikan menggunakan HTTPS atau localhost).');
      }
      
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((track) => track.stop());

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      this.cameraList = deviceList.filter((dev) => dev.kind === 'videoinput');
      return this.cameraList;
    } catch (err) {
      logError('CameraService: loadCameras failed', err);
      throw new Error(getCameraErrorMessage(err));
    }
  }

  async startCamera(selectedCameraId = null) {
    try {
      this.stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera di lingkungan saat ini.');
      }

      const options = this.getMediaConstraints(selectedCameraId);
      this.stream = await navigator.mediaDevices.getUserMedia(options);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      return this.stream;
    } catch (err) {
      logError('CameraService: startCamera failed', err);
      throw new Error(getCameraErrorMessage(err));
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.previousFrameTime = 0;
  }

  setFPS(targetFps) {
    this.currentFps = parseInt(targetFps, 10) || 30;
    this.frameDelay = 1000 / this.currentFps;
  }

  isActive() {
    return Boolean(this.stream && this.stream.active);
  }

  isReady() {
    return Boolean(
      this.video &&
      this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      this.video.videoWidth > 0 &&
      this.video.videoHeight > 0 &&
      this.isActive()
    );
  }

  shouldProcessFrame() {
    const currentTime = performance.now();
    if (currentTime - this.previousFrameTime >= this.frameDelay) {
      this.previousFrameTime = currentTime;
      return true;
    }
    return false;
  }

  getMediaConstraints(cameraId) {
    if (cameraId === 'front') {
      return {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };
    }

    if (cameraId && cameraId !== 'default') {
      return {
        video: {
          deviceId: { exact: cameraId },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };
    }

    return {
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    };
  }
}