
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Copy, Check, RefreshCw, VideoOff, Bot, Loader2, Link as LinkIcon, Barcode, Volume2, Waves, Upload, Camera } from "lucide-react";
import { analyzeCode, AnalyzeCodeOutput } from "@/ai/flows/analyze-code-flow";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech-flow";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/context/history-context";
import { Separator } from "@/components/ui/separator";

interface ScannerProps {
  type: "QR" | "Barcode";
}

export function Scanner({ type }: ScannerProps) {
  const { addHistoryItem } = useHistory();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audio, setAudio] = useState<TextToSpeechOutput | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanningAnimation = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanSuccess = useCallback((result: string) => {
    stopCamera();
    setScanResult(result);
    addHistoryItem({ content: result, type: type, timestamp: new Date().toISOString() });
    runAnalysis(result);
  }, [addHistoryItem, type, stopCamera]);
  
  const scanFromCanvas = useCallback(() => {
    if (canvasRef.current) {
        const context = canvasRef.current.getContext("2d", { willReadFrequently: true });
        if (context) {
            const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
                return code.data;
            }
        }
    }
    return null;
  }, []);

  const tick = useCallback(() => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const codeData = scanFromCanvas();
        if (codeData) {
            handleScanSuccess(codeData);
            return;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [handleScanSuccess, scanFromCanvas]);


  const startScan = useCallback(async () => {
    setScanResult(null);
    setAnalysis(null);
    setAudio(null);
    
    if (hasCameraPermission === false) {
      toast({
        variant: 'destructive',
        title: 'Camera Access Required',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      setHasCameraPermission(false);
      setIsScanning(false);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Could not start the camera. Please check permissions and try again.',
      });
    }
  }, [hasCameraPermission, tick, toast]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (hasCameraPermission !== null) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
  }, [hasCameraPermission]);

  useEffect(() => {
    return () => {
        stopCamera();
        stopScanningAnimation();
    };
  }, [stopCamera, stopScanningAnimation]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.drawImage(img, 0, 0);
                const codeData = scanFromCanvas();
                if (codeData) {
                    handleScanSuccess(codeData);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Scan Failed',
                        description: `No ${type} code could be found in the uploaded image.`,
                    });
                }
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    if(event.target) event.target.value = '';
  };

  const runAnalysis = async (content: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const analysisResult = await analyzeCode({ content });
      setAnalysis(analysisResult);
    } catch (error) {
      console.error("Error analyzing code:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not get AI analysis for the scanned code.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (!analysis?.summary) return;
    setIsGeneratingSpeech(true);
    setAudio(null);
    try {
      const result = await textToSpeech({ text: analysis.summary });
      if (result.audioUrl) {
        setAudio(result);
      } else {
         toast({
          variant: "destructive",
          title: "Text-to-Speech Failed",
          description: "Could not generate audio for the analysis at this time.",
        });
      }
    } catch (error) {
       console.error("Error generating speech:", error);
      toast({
        variant: "destructive",
        title: "Text-to-Speech Failed",
        description: "Could not generate audio for the analysis.",
      });
    } finally {
      setIsGeneratingSpeech(false);
    }
  }
  
  useEffect(() => {
    if(audio?.audioUrl && audioRef.current){
        audioRef.current.play().catch(console.error);
    }
  }, [audio])

  const handleCopy = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied to clipboard!",
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setAnalysis(null);
    setAudio(null);
  };
  
  if (scanResult) {
    return (
      <Card className="w-full shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
             <div className="bg-primary/10 text-primary p-3 rounded-lg">
                {type === "QR" ? <QrCode className="h-6 w-6" /> : <Barcode className="h-6 w-6" />}
             </div>
            <div>
                <CardTitle>{type} Scanned Successfully!</CardTitle>
                <CardDescription>The following data was read from the code.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="break-all font-mono text-sm text-muted-foreground">{scanResult}</p>
          </div>
          
            <Separator />

             <div className="space-y-3">
                 <div className="flex items-center gap-2 font-semibold">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>AI Analysis</span>
                    {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                 </div>
                 {isAnalyzing ? (
                    <p className="text-sm text-muted-foreground pt-4 text-center">Analyzing...</p>
                 ) : analysis ? (
                    <div className="space-y-4 pt-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Content Type</span>
                          <Badge variant="secondary">{analysis.contentType}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Risk Assessment</span>
                          <Badge variant={analysis.riskAssessment.includes("Low") ? "default" : "destructive"}>{analysis.riskAssessment}</Badge>
                        </div>
                        <div className="space-y-2 pt-2">
                           <p className="italic leading-relaxed text-muted-foreground">{analysis.summary}</p>
                           <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleTextToSpeech} 
                              disabled={isGeneratingSpeech}
                              className="flex-1"
                            >
                              {isGeneratingSpeech ? <Waves className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                              {isGeneratingSpeech ? "Generating..." : "Read Aloud"}
                            </Button>
                            {audio && audio.audioUrl && <audio ref={audioRef} src={audio.audioUrl} className="w-full h-9 flex-1" controls />}
                           </div>
                        </div>
                      </div>
                 ) : (
                    <p className="text-sm text-muted-foreground pt-4 text-center">No analysis available.</p>
                 )}
            </div>
          
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
           <a 
            href={scanResult.startsWith("http") ? scanResult : `https://www.google.com/search?q=${encodeURIComponent(scanResult)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mr-auto"
          >
            <Button variant="link">
              <LinkIcon className="mr-2 h-4 w-4" />
              Open Link
            </Button>
          </a>
          <Button variant="outline" onClick={handleScanAgain}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Again
          </Button>
          <Button onClick={handleCopy} disabled={isCopied}>
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? "Copied" : "Copy"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-primary/20">
       <CardHeader>
        <CardTitle>Scan a {type} Code</CardTitle>
        <CardDescription>Position the code inside the frame to scan it automatically, or upload an image.</CardDescription>
       </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative mb-4 flex aspect-square w-full max-w-sm items-center justify-center rounded-lg border-2 border-dashed bg-muted overflow-hidden border-primary/20">
          
          <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />

          {isScanning && <div className="scan-line" />}

           { !isScanning && hasCameraPermission !== false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/80 p-4 text-center">
              <QrCode className="h-12 w-12 mb-2" />
              <p className="font-semibold">Ready to Scan</p>
              <p className="text-xs">Use your camera or upload an image.</p>
            </div>
          )}
          
          { hasCameraPermission === false && (
             <Alert variant="destructive" className="absolute inset-4 h-fit">
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please allow camera access in your browser settings to use this feature.
                </AlertDescription>
              </Alert>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
            >
                <Upload className="mr-2 h-4 w-4"/>
                Upload Image
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            <Button 
              onClick={isScanning ? stopCamera : startScan} 
              size="lg"
              disabled={hasCameraPermission === null || hasCameraPermission === false}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stop Scan
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4"/>
                  Use Camera
                </>
              )}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
