// Type declarations for face-api.js loaded via script tag
declare global {
  interface Window {
    faceapi: {
      nets: {
        tinyFaceDetector: { loadFromUri: (uri: string) => Promise<void> };
        faceLandmark68Net: { loadFromUri: (uri: string) => Promise<void> };
        faceRecognitionNet: { loadFromUri: (uri: string) => Promise<void> };
        ssdMobilenetv1: { loadFromUri: (uri: string) => Promise<void> };
      };
      TinyFaceDetectorOptions: new () => unknown;
      detectSingleFace: (
        input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
        options?: unknown
      ) => {
        withFaceLandmarks: () => {
          withFaceDescriptor: () => Promise<{
            descriptor: Float32Array;
            detection: { box: { x: number; y: number; width: number; height: number } };
          } | null>;
        };
      };
      detectAllFaces: (
        input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
        options?: unknown
      ) => {
        withFaceLandmarks: () => {
          withFaceDescriptors: () => Promise<
            Array<{
              descriptor: Float32Array;
              detection: { box: { x: number; y: number; width: number; height: number } };
            }>
          >;
        };
      };
      euclideanDistance: (a: Float32Array | number[], b: Float32Array | number[]) => number;
      resizeResults: (results: unknown, displaySize: { width: number; height: number }) => unknown;
      draw: {
        drawDetections: (canvas: HTMLCanvasElement, detections: unknown) => void;
        drawFaceLandmarks: (canvas: HTMLCanvasElement, landmarks: unknown) => void;
      };
    };
  }
}

export {};
