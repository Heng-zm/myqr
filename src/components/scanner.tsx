
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ScanLine, Copy, Check, RefreshCw, VideoOff, Bot, Loader2, Link as LinkIcon, Barcode, Volume2, Waves } from "lucide-react";
import { analyzeCode, AnalyzeCodeOutput } from "@/ai/flows/analyze-code-flow";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type HistoryItem } from "@/components/scan-history";
import { Badge } from "@/components/ui/badge";

interface ScannerProps {
  type: "QR" | "Barcode";
  onScan: (item: HistoryItem) => void;
}

export function Scanner({ type, onScan }: ScannerProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audio, setAudio] = useState<TextToSpeechOutput | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const stopScanningAnimation = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
  }, []);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleScanSuccess = useCallback((result: string) => {
    setIsScanning(false);
    setScanResult(result);
    onScan({ content: result, type: type, timestamp: new Date().toISOString() });
    runAnalysis(result);
    stopCameraStream();
    stopScanningAnimation();
  }, [onScan, type, stopCameraStream, stopScanningAnimation]);

  const scan = useCallback(() => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          handleScanSuccess(code.data);
          return; // Stop scanning after a successful scan
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(scan);
  }, [handleScanSuccess]);
  
  useEffect(() => {
    const startCamera = async () => {
      // Always reset states when starting
      setScanResult(null);
      setAnalysis(null);
      setAudio(null);
      setHasCameraPermission(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(scan);
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        setIsScanning(false); // Stop the scanning state
        let description = 'There was an error accessing the camera.';
        if (error instanceof Error && error.name === "NotAllowedError") {
            description = 'Please enable camera permissions in your browser settings to use this app.';
        }
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: description,
        });
      }
    };

    if (isScanning) {
      startCamera();
    } else {
      stopScanningAnimation();
      stopCameraStream();
    }

    return () => {
      stopScanningAnimation();
      stopCameraStream();
    };
  }, [isScanning, scan, stopCameraStream, stopScanningAnimation, toast]);


  const handleStartScan = () => {
    setScanResult(null);
    setAnalysis(null);
    setAudio(null);
    setIsScanning(true);
  };
  
  const handleStopScan = () => {
    setIsScanning(false);
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
      setAudio(result);
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
        description: scanResult,
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setAnalysis(null);
    setAudio(null);
    setIsScanning(true);
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
        <CardContent>
          <div className="p-4 rounded-lg bg-muted">
            <p className="break-all font-mono text-sm text-muted-foreground">{scanResult}</p>
          </div>
          
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-base font-semibold">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span>AI Analysis</span>
                      {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isAnalyzing && <p className="text-sm text-muted-foreground pt-4 text-center">Analyzing...</p>}
                    {analysis ? (
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
                            {audio && <audio ref={audioRef} src={audio.audioUrl} className="w-full h-9 flex-1" controls />}
                           </div>
                        </div>
                      </div>
                    ) : (
                      !isAnalyzing && <p className="text-sm text-muted-foreground pt-4 text-center">No analysis available.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleScanAgain}>
            <RefreshCw />
            Scan Again
          </Button>
          <Button onClick={handleCopy} disabled={isCopied}>
            {isCopied ? <Check /> : <Copy />}
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
        <CardDescription>Position the code inside the frame to scan it automatically.</CardDescription>
       </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className={`relative mb-4 flex aspect-square w-full max-w-sm items-center justify-center rounded-lg border-4 border-dashed border-primary/20 bg-muted overflow-hidden ${isScanning ? 'animate-pulse-border' : ''}`}>
          {(!isScanning && hasCameraPermission !== false) && (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <QrCode className="h-12 w-12 mb-2" />
              <p className="font-semibold">Ready to Scan</p>
            </div>
          )}

          <video ref={videoRef} className={`w-full h-full object-cover ${!isScanning && 'hidden'}`} playsInline autoPlay muted />

          {isScanning && hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/80">
              <Loader2 className="h-12 w-12 mb-2 animate-spin" />
              <p>Requesting camera...</p>
            </div>
          )}
          
          {hasCameraPermission === false && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/80 p-4 text-center">
                <VideoOff className="h-12 w-12 mb-2" />
                <p className="font-semibold">Camera access denied</p>
                <p className="text-xs">Please allow camera access in your browser settings to use this feature.</p>
             </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <Button 
          onClick={isScanning ? handleStopScan : handleStartScan} 
          className="w-full" 
          size="lg"
          disabled={hasCameraPermission === false && !isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="animate-spin" />
              Stop Scanning
            </>
          ) : (
            <>
              <ScanLine />
              Start {type} Scan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
