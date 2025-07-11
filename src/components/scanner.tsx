
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ScanLine, Copy, Check, RefreshCw, VideoOff, Bot, Loader2, Link as LinkIcon, Barcode } from "lucide-react";
import { analyzeCode, AnalyzeCodeOutput } from "@/ai/flows/analyze-code-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type HistoryItem } from "@/components/scan-history";

interface ScannerProps {
  type: "QR" | "Barcode";
  onScan: (item: HistoryItem) => void;
}

const mockData = {
  QR: "https://firebase.google.com/",
  Barcode: "8414906123456",
};

export function Scanner({ type, onScan }: ScannerProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalyzeCodeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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


  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setAnalysis(null);
    setTimeout(() => {
      const result = mockData[type] + (type === 'QR' ? `?time=${Date.now()}` : `-${Math.floor(Math.random() * 900 + 100)}`);
      setScanResult(result);
      onScan({ content: result, type: type, timestamp: new Date().toISOString() });
      setIsScanning(false);
      runAnalysis(result);
    }, 2200);
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
  };
  
  if (scanResult) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
             {type === "QR" ? <QrCode className="h-8 w-8 text-primary" /> : <Barcode className="h-8 w-8 text-primary" />}
            <div>
                <CardTitle>{type} Scanned Successfully!</CardTitle>
                <CardDescription>The following data was read from the code.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="break-all rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground">{scanResult}</p>
          
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span>AI Analysis</span>
                      {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isAnalyzing && <p className="text-sm text-muted-foreground">Analyzing...</p>}
                    {analysis ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <LinkIcon className="h-4 w-4 mt-1" />
                          <div><strong>Content Type:</strong> {analysis.contentType}</div>
                        </div>
                        <div className="flex items-start gap-2">
                           <Check className="h-4 w-4 mt-1 text-green-500" />
                          <div><strong>Risk Assessment:</strong> {analysis.riskAssessment}</div>
                        </div>
                        <p className="pt-2 italic">{analysis.summary}</p>
                      </div>
                    ) : (
                      !isAnalyzing && <p className="text-sm text-muted-foreground">No analysis available.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
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
    <Card className="w-full shadow-lg">
      <CardContent className="flex flex-col items-center justify-center p-6 pt-8">
        <div className="relative mb-6 flex h-64 w-full items-center justify-center rounded-lg border-4 border-dashed border-primary/20 bg-muted overflow-hidden">
          {hasCameraPermission === true ? (
             <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          ) : hasCameraPermission === false ? (
             <div className="flex flex-col items-center justify-center text-muted-foreground">
                <VideoOff className="h-16 w-16 mb-2" />
                <p>Camera access denied</p>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <QrCode className="h-16 w-16 mb-2 animate-pulse" />
              <p>Requesting camera...</p>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="absolute top-0 h-1 w-full bg-primary/70 animate-[scan-line_2s_ease-in-out_infinite]" style={{ animationName: 'scan-line' }} />
            </div>
          )}
        </div>
        
        {hasCameraPermission === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
        )}

        <h3 className="mb-2 text-lg font-semibold text-foreground">Ready to Scan</h3>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Position the {type} code in front of the camera and press the button.
        </p>
        <Button onClick={handleScan} disabled={isScanning || !hasCameraPermission} className="w-full" size="lg">
          {isScanning ? "Scanning..." : `Start ${type} Scan`}
        </Button>
      </CardContent>
    </Card>
  );
}
