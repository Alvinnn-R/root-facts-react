import { useRef, useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG, isValidDetection } from './utils/config';
import { createDelay, logError } from './utils/common';

function App() {
  const { state, actions } = useAppState();
  const detectionLoopRef = useRef(null);
  const isRunningRef = useRef(false);
  const prevDetectedLabel = useRef(null);
  const [currentTone, setCurrentTone] = useState('normal');
  const [copyStatus, setCopyStatus] = useState('idle');

  useEffect(() => {
    let isCancelled = false;

    const setupServices = async () => {
      const detectorSvc = new DetectionService();
      const cameraSvc = new CameraService();
      const factsSvc = new RootFactsService();

      actions.setServices({ detector: detectorSvc, camera: cameraSvc, generator: factsSvc });

      try {
        // Minta izin kamera di awal agar browser menampilkan prompt allow
        try {
          await cameraSvc.loadCameras();
        } catch (camErr) {
          logError('Izin kamera awal gagal atau ditolak', camErr);
        }

        actions.setModelStatus('Memuat Model AI... 0%');
        await detectorSvc.loadModel((progressPct) => {
          if (!isCancelled) {
            actions.setModelStatus(`Menunggu Model... ${progressPct}%`);
          }
        });

        if (isCancelled) return;
        actions.setModelStatus('Menunggu Model... 100%');

        actions.setModelStatus('Memuat Generator... 0%');
        await factsSvc.loadModel((progressPct) => {
          if (!isCancelled) {
            actions.setModelStatus(`Memuat Generator... ${progressPct}%`);
          }
        });

        if (isCancelled) return;
        actions.setModelStatus('Model AI Siap');
      } catch (error) {
        if (!isCancelled) {
          logError('App.setupServices failed', error);
          actions.setError('Gagal memuat model. Silakan refresh halaman.');
          actions.setModelStatus('Gagal Memuat Model');
        }
      }
    };

    setupServices();

    return () => {
      isCancelled = true;
      stopDetectionLoop();
    };
  }, [actions]);

  useEffect(() => {
    return () => {
      if (state.services.camera) {
        state.services.camera.stopCamera();
      }
    };
  }, [state.services.camera]);

  const stopDetectionLoop = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const startDetectionLoop = useCallback((detectorSvc, cameraSvc, factsSvc) => {
    let isFetchingFactData = false;

    const runLoop = async () => {
      if (!isRunningRef.current) return;

      if (cameraSvc.shouldProcessFrame() && cameraSvc.isReady()) {
        const detectionResult = await detectorSvc.predict(cameraSvc.video);

        if (detectionResult && isValidDetection(detectionResult)) {
          if (detectionResult.label !== prevDetectedLabel.current && !isFetchingFactData) {
            prevDetectedLabel.current = detectionResult.label;
            isFetchingFactData = true;

            actions.setDetectionResult(detectionResult);
            actions.setAppState('analyzing');
            actions.setFunFactData(null);

            await createDelay(APP_CONFIG.analyzingDelay);

            if (!isRunningRef.current) {
              isFetchingFactData = false;
              return;
            }

            actions.setAppState('result');

            await createDelay(APP_CONFIG.factsGenerationDelay);

            if (!isRunningRef.current) {
              isFetchingFactData = false;
              return;
            }

            try {
              const generatedFact = await factsSvc.generateFacts(detectionResult.label);
              actions.setFunFactData(generatedFact || 'error');
            } catch {
              actions.setFunFactData('error');
            } finally {
              isFetchingFactData = false;
            }
          }
        }
      }

      detectionLoopRef.current = requestAnimationFrame(runLoop);
    };

    detectionLoopRef.current = requestAnimationFrame(runLoop);
  }, [actions]);

  const handleToggleCamera = useCallback(async (selectedCameraId = null) => {
    const { detector, camera, generator } = state.services;
    if (!detector || !camera || !generator) return;

    if (state.isRunning) {
      isRunningRef.current = false;
      stopDetectionLoop();
      camera.stopCamera();
      prevDetectedLabel.current = null;
      actions.setRunning(false);
      actions.resetResults();
    } else {
      try {
        actions.setError(null);
        await camera.startCamera(selectedCameraId);
        isRunningRef.current = true;
        actions.setRunning(true);
        startDetectionLoop(detector, camera, generator);
      } catch (err) {
        actions.setError(err.message || 'Gagal memulai akses kamera.');
        actions.setRunning(false);
        isRunningRef.current = false;
      }
    }
  }, [state.services, state.isRunning, actions, stopDetectionLoop, startDetectionLoop]);

  const handleToneChange = useCallback((selectedTone) => {
    setCurrentTone(selectedTone);
    if (state.services.generator) {
      state.services.generator.setTone(selectedTone);
    }
    prevDetectedLabel.current = null;
  }, [state.services.generator]);

  const handleCopyFact = useCallback(async () => {
    const textData = state.funFactData;
    if (!textData || textData === 'error') return;

    try {
      await navigator.clipboard.writeText(textData);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      logError('App.handleCopyFact error', err);
    }
  }, [state.funFactData]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
          copyStatus={copyStatus}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js &amp; Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
