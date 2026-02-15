"use client"

import { useRef, useState } from "react"
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { PenTool, Eraser, RotateCcw, Check } from "lucide-react"
import { useLanguage } from "@/context/language-context"

interface DrawingModalProps {
    onSave: (image: string) => void;
    trigger?: React.ReactNode;
}

export function DrawingModal({ onSave, trigger }: DrawingModalProps) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const { t, language } = useLanguage();
    const [strokeColor, setStrokeColor] = useState("#000000");
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [eraserMode, setEraserMode] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = async () => {
        if (canvasRef.current) {
            const data = await canvasRef.current.exportImage("png");
            onSave(data);
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        canvasRef.current?.clearCanvas();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline"><PenTool className="mr-2 h-4 w-4" />{t("styles.drawSketch")}</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Fikrinizi Çizin" : "Draw Your Idea"}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 border rounded-md overflow-hidden relative bg-white" style={{ cursor: eraserMode ? 'cell' : 'crosshair' }}>
                    <ReactSketchCanvas
                        ref={canvasRef}
                        strokeWidth={strokeWidth}
                        strokeColor={eraserMode ? "#FFFFFF" : strokeColor}
                        canvasColor="#FFFFFF"
                        className="w-full h-full"
                    />
                </div>

                <div className="flex items-center gap-4 py-4">
                    <div className="flex items-center gap-2 border-r pr-4">
                        <Button
                            variant={!eraserMode ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setEraserMode(false)}
                        >
                            <PenTool className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={eraserMode ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setEraserMode(true)}
                        >
                            <Eraser className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleClear}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-muted-foreground w-16">{language === "tr" ? "Boyut" : "Size"}: {strokeWidth}px</span>
                        <Slider
                            value={[strokeWidth]}
                            onValueChange={(v) => setStrokeWidth(v[0])}
                            max={20} min={1} step={1}
                            className="w-32"
                        />

                        <div className="ml-4 flex gap-1">
                            {["#000000", "#FF0000", "#0000FF", "#008000"].map(c => (
                                <div
                                    key={c}
                                    className={`w-6 h-6 rounded-full cursor-pointer border ${strokeColor === c && !eraserMode ? 'ring-2 ring-primary' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => { setStrokeColor(c); setEraserMode(false); }}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSave} className="gap-2 bg-violet-500 text-white hover:bg-violet-600">
                            <Check className="h-4 w-4" />{language === "tr" ? "Eskizi Kaydet" : "Save Sketch"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
