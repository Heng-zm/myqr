
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
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audio, setAudio] = useState<TextToSpeechOutput | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, []);

  const handleScanSuccess = useCallback((result: string) => {
    setScanResult(result);
    onScan({ content: result, type: type, timestamp: new Date().toISOString() });
    stopScanning();
    runAnalysis(result);
  }, [onScan, stopScanning, type]);

  const scan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }
  
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
  
    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: type === 'QR' ? "dontInvert" : "attemptBoth",
      });
  
      if (code && code.data) {
        handleScanSuccess(code.data);
      }
    }
  
    animationFrameId.current = requestAnimationFrame(scan);
  }, [isScanning, handleScanSuccess, type]);
  

  useEffect(() => {
    if (isScanning && hasCameraPermission) {
      animationFrameId.current = requestAnimationFrame(scan);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning, hasCameraPermission, scan]);
  

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    if (hasCameraPermission === null) {
      getCameraPermission();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast, hasCameraPermission]);


  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setAnalysis(null);
    setAudio(null);
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
        audioRef.current.play();
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
        <div className="relative mb-4 flex aspect-square w-full max-w-sm items-center justify-center rounded-lg border-4 border-dashed border-primary/20 bg-muted overflow-hidden">
          {hasCameraPermission === true ? (
             <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
          ) : hasCameraPermission === false ? (
             <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <VideoOff className="h-12 w-12 mb-2" />
                <p className="font-semibold">Camera access denied</p>
                <p className="text-xs">Please allow camera access in your browser settings.</p>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-2 animate-spin" />
              <p>Requesting camera...</p>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="absolute top-0 h-1 w-full bg-primary/70 animate-[scan-line_2s_ease-in-out_infinite]" style={{ animationName: 'scan-line' }} />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        {hasCameraPermission === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={isScanning ? stopScanning : handleStartScan} disabled={!hasCameraPermission} className="w-full" size="lg">
          {isScanning ? (
            <>
              <Loader2 className="animate-spin" />
              Scanning...
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
