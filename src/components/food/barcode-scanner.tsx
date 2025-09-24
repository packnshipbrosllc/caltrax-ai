'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarcodeScannerProps {
  onClose: () => void;
  onFoodDetected: (foodData: any) => void;
}

const BarcodeScanner = ({ onClose, onFoodDetected }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access to scan barcodes.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const simulateBarcodeDetection = () => {
    // Simulate barcode detection with a random food item
    const sampleFoods = [
      {
        name: 'Chicken Breast (cooked)',
        calories: 165,
        protein: 31,
        fat: 3.6,
        carbs: 0,
        serving: '100g',
        barcode: '1234567890123'
      },
      {
        name: 'Greek Yogurt (plain)',
        calories: 59,
        protein: 10,
        fat: 0.4,
        carbs: 3.6,
        serving: '100g',
        barcode: '2345678901234'
      },
      {
        name: 'Brown Rice (cooked)',
        calories: 111,
        protein: 2.6,
        fat: 0.9,
        carbs: 23,
        serving: '100g',
        barcode: '3456789012345'
      }
    ];
    
    const randomFood = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
    
    // Simulate detection delay
    setTimeout(() => {
      onFoodDetected(randomFood);
      onClose();
    }, 1500);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Barcode Scanner
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning && !permissionDenied && (
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-base-200 rounded-lg flex items-center justify-center">
                  <Camera className="w-16 h-16 text-base-content/50" />
                </div>
                <div>
                  <h3 className="font-medium text-base-content mb-2">Scan Barcode</h3>
                  <p className="text-sm text-base-content/70 mb-4">
                    Point your camera at a barcode to automatically detect food items
                  </p>
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-white rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-base-content/70 mb-4">
                    Position the barcode within the frame
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={stopCamera} className="flex-1">
                      Stop Camera
                    </Button>
                    <Button onClick={simulateBarcodeDetection} className="flex-1">
                      Simulate Detection
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {permissionDenied && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-error/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-error" />
                </div>
                <div>
                  <h3 className="font-medium text-base-content mb-2">Camera Permission Required</h3>
                  <p className="text-sm text-base-content/70 mb-4">
                    Please allow camera access in your browser settings to scan barcodes
                  </p>
                  <div className="space-y-2">
                    <Button onClick={startCamera} className="w-full">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={onClose} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && !permissionDenied && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-error/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-error" />
                </div>
                <div>
                  <h3 className="font-medium text-base-content mb-2">Camera Error</h3>
                  <p className="text-sm text-base-content/70 mb-4">{error}</p>
                  <div className="space-y-2">
                    <Button onClick={startCamera} className="w-full">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={onClose} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Mode Notice */}
            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-info mb-1">Demo Mode</p>
                  <p className="text-info/80">
                    This is a simulated barcode scanner. In a real app, this would use a barcode detection library 
                    to scan actual product barcodes and fetch nutrition data from a food database API.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BarcodeScanner;
