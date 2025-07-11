
"use client";

import { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2, Bot, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { generateImage, GenerateImageOutput } from "@/ai/flows/generate-image-flow";
import { generateQrContent } from "@/ai/flows/generate-qr-content-flow";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useHistory } from "@/context/history-context";

interface QrGeneratorProps {}

export function QrGenerator({}: QrGeneratorProps) {
  const { addHistoryItem } = useHistory();
  const [value, setValue] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GenerateImageOutput & { prompt: string } | null>(null);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [fgColor, setFgColor] = useState("#000000");

  const handleGenerate = () => {
    if (!value) {
        toast({
            variant: "destructive",
            title: "Input Required",
            description: "Please enter some text or a URL to generate a QR code.",
        });
        return;
    }
    setQrCodeData(value);
    setGeneratedImage(null);
    addHistoryItem({
        content: value,
        type: 'Generated',
        timestamp: new Date().toISOString(),
    });
  };

  const handleGenerateContent = async () => {
    if(!value) {
        toast({
            variant: "destructive",
            title: "Input Required",
            description: "Please enter a topic to generate content.",
        });
        return;
    }
    setIsGeneratingContent(true);
    try {
        const result = await generateQrContent({ topic: value });
        setValue(result.content);
        setQrCodeData(result.content);
        addHistoryItem({
            content: result.content,
            type: 'Generated',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error generating content:", error);
        toast({
            variant: "destructive",
            title: "Content Generation Failed",
            description: "Could not generate AI content for your topic.",
        });
    } finally {
        setIsGeneratingContent(false);
    }
  }

  const handleGenerateImage = async () => {
    if (!qrCodeData) return;
    const currentQrData = qrCodeData;
    setIsGeneratingImage(true);
    try {
      const result = await generateImage({ prompt: currentQrData });
      if (qrCodeData === currentQrData) {
        setGeneratedImage({ ...result, prompt: currentQrData });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: "Could not generate an AI image for your QR code.",
      });
    } finally {
       if (qrCodeData === currentQrData) {
        setIsGeneratingImage(false);
      }
    }
  }

  const handleDownload = () => {
    const svg = document.getElementById("QRCode");
    const aiImage = document.getElementById("ai-background-image") as HTMLImageElement;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasSize = 320;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const drawQrCode = () => {
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const qrImg = new window.Image();
        qrImg.onload = () => {
            const qrSize = 160;
            const x = (canvasSize - qrSize) / 2;
            const y = (canvasSize - qrSize) / 2;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.roundRect(x - 10, y - 10, qrSize + 20, qrSize + 20, 8);
            ctx.fill();

            ctx.drawImage(qrImg, x, y, qrSize, qrSize);
            
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "qrcode-custom.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        qrImg.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    };

    if (generatedImage && aiImage) {
        const bgImg = new window.Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, canvasSize, canvasSize);
            drawQrCode();
        };
        bgImg.src = aiImage.src;
    } else {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx || !svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new window.Image();
        img.onload = () => {
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            const pngFile = tempCanvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "qrcode.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        }
        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    }
  }

  const handleShare = async () => {
    if (navigator.share && qrCodeData) {
      try {
        await navigator.share({
            title: 'QR Code',
            text: `QR Code for: ${qrCodeData}`,
            url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: "Could not share the QR code.",
        });
      }
    } else {
        toast({
            title: "Share Not Supported",
            description: "Your browser does not support the Web Share API.",
        });
    }
  }
  
  const handleReset = () => {
    setValue("");
    setQrCodeData("");
    setGeneratedImage(null);
  }

  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
        <CardDescription>Enter text or a URL to create your own QR code. You can even generate a unique AI image to go with it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCodeData ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-muted/50 p-6">
             <div className="relative h-80 w-80 flex items-center justify-center rounded-lg border shadow-md overflow-hidden bg-background">
                {isGeneratingImage ? (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-background/50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted-foreground">Generating your image...</p>
                    </div>
                ) : generatedImage && generatedImage.prompt === qrCodeData ? (
                    <>
                        <Image
                            id="ai-background-image"
                            src={generatedImage.imageUrl}
                            alt="AI generated background"
                            layout="fill"
                            objectFit="cover"
                        />
                         <div className="relative p-2 bg-white/90 rounded-md backdrop-blur-sm">
                             <QRCode id="QRCode" value={qrCodeData} size={144} bgColor="transparent" fgColor="#000000" />
                         </div>
                    </>
                ) : (
                    <div className="p-4 bg-white flex items-center justify-center">
                        <QRCode id="QRCode" value={qrCodeData} size={256} bgColor={bgColor} fgColor={fgColor} />
                    </div>
                )}
             </div>

            <div className="w-full space-y-4 pt-4">
              <Button onClick={handleGenerateImage} disabled={isGeneratingImage} className="w-full">
                {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                {isGeneratingImage ? 'Generating...' : 'Customize with AI Background'}
              </Button>
               {!generatedImage && (
                <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-center text-muted-foreground">Customize Colors</p>
                    <div className="flex gap-4 justify-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <Label htmlFor="bg-color">Background</Label>
                            <Input id="bg-color" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="p-1 h-10 w-14"/>
                        </div>
                         <div className="flex flex-col items-center gap-1.5">
                            <Label htmlFor="fg-color">Foreground</Label>
                            <Input id="fg-color" type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="p-1 h-10 w-14"/>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="qr-content">Content or AI Prompt</Label>
            <Textarea
              id="qr-content"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. A journey of a thousand miles begins with a single step."
              rows={4}
            />
            <div className="flex flex-col sm:flex-row gap-2">
                 <Button onClick={handleGenerateContent} className="w-full" disabled={isGeneratingContent}>
                    {isGeneratingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isGeneratingContent ? 'Generating...' : 'Generate with AI'}
                 </Button>
                 <Button onClick={handleGenerate} className="w-full">Generate QR Code</Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {qrCodeData ? (
          <>
            <Button variant="ghost" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" /> Create Another
            </Button>
            {navigator.share && <Button variant="outline" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" />Share</Button>}
            <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download</Button>
          </>
        ) : null}
      </CardFooter>
    </Card>
  );
}
