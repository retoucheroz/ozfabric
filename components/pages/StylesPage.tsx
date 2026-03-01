"use client"

import { useLanguage } from "@/context/language-context"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { downloadImage } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Wand2, Download, Share2, Loader2, Image as ImageIcon, PenTool, FolderPlus } from "lucide-react"
import { DrawingModal } from "@/components/features/DrawingModal"
import { useProjects } from "@/context/projects-context"
import { toast } from "sonner"

function StylesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addProject, deductCredits, collections, addToCollection, projects } = useProjects();
  const { t, language } = useLanguage();
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [negativePrompt, setNegativePrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)

  // New state for sketch
  const [sketchFile, setSketchFile] = useState<File | null>(null)
  const [sketchPreview, setSketchPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSketchFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSketchPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrawSave = (base64: string) => {
    setSketchPreview(base64);
    setSketchFile(null);
  };


  const handleGenerate = async () => {
    if (!prompt) return;

    if (!(await deductCredits(1))) {
      toast.error("Insufficient Credits - Upgrade to Continue");
      return;
    }

    setIsGenerating(true);
    setResultImage(null);

    try {
      let sketchBase64 = null;

      if (sketchPreview) {
        sketchBase64 = sketchPreview;
      } else if (sketchFile) {
        sketchBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(sketchFile);
        });
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          sketchImage: sketchBase64
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();

      if (data.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success("Style Generated Successfully");
        addProject({
          title: prompt.slice(0, 30) + (prompt.length > 30 ? "..." : ""),
          type: "Style",
          imageUrl: data.imageUrl,
          description: prompt,
          mediaType: "image"
        });
      } else {
        toast.error("No image URL returned from API");
      }
    } catch (error) {
      console.error("Failed to generate:", error);
      toast.error("Failed to generate style. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden">
      {/* Left Control Panel */}
      <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-background p-4 lg:overflow-y-auto space-y-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold mb-2 tracking-tight">{t("styles.createNewStyle")}</h2>
          <p className="text-sm text-muted-foreground">
            {language === "tr" ? "Eskizlerinizden veya metinlerden profesyonel moda tasarımları oluşturun." : "Create professional fashion designs from your sketches or text prompts."}
          </p>
        </div>

        <div className="space-y-6 lg:flex-1 lg:overflow-y-auto pr-2">
          {/* Sketch Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">
                {t("styles.referenceSketch")}
              </label>
              {mounted && (
                <DrawingModal
                  onSave={handleDrawSave}
                  trigger={
                    <Button variant="outline" className="border-primary/20 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:text-violet-600 transition-colors">
                      <PenTool className="mr-2 h-4 w-4 text-violet-500" />
                      {t("styles.drawSketch")}
                    </Button>
                  }
                />
              )}
            </div>
            <div className="border-2 border-dashed rounded-xl h-32 bg-muted/20 relative group hover:border-violet-500 transition-colors overflow-hidden">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handleFileChange}
              />

              {sketchPreview ? (
                <div className="relative w-full h-full">
                  <img src={sketchPreview} className="w-full h-full object-contain p-2" alt="Sketch Preview" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">{t("styles.clickToChange")}</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <div className="p-2 bg-background/50 rounded-full shadow-sm">
                    <ImageIcon className="w-5 h-5 opacity-50" />
                  </div>
                  <span className="text-xs">{t("styles.dropSketch")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t("styles.prompt")}
            </label>
            <Textarea
              placeholder={t("styles.promptPlaceholder")}
              className="h-32 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t("styles.negativePrompt")}
            </label>
            <Textarea
              placeholder={t("styles.negativePromptPlaceholder")}
              className="h-20 resize-none text-muted-foreground"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button
              className="w-full h-12 text-lg gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("styles.generating")}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {t("styles.generateStyle")}
                </>
              )}
            </Button>
            <div className="text-center mt-3 text-xs text-muted-foreground font-medium">
              {t("styles.cost")}
            </div>
          </div>
        </div>
      </div>

      {/* Right Canvas/Preview Area */}
      <div className="flex-1 bg-stone-50 dark:bg-stone-950/50 p-4 md:p-8 flex items-center justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] min-h-[500px]">
        {/* Toolbar */}
        <div className="absolute top-6 right-6 flex gap-2">
          {resultImage && (
            <>

              <Button variant="secondary" onClick={() => router.push(`/studio?image=${encodeURIComponent(resultImage)}`)}>
                {t("common.getSpecs")}
              </Button>
              <div className="w-px h-8 bg-border mx-2" />
            </>
          )}
          <Button variant="secondary" size="icon" disabled={!resultImage} onClick={() => resultImage && downloadImage(resultImage, 'modeon-style.png')}><Download className="w-4 h-4" /></Button>


          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" disabled={!resultImage}><FolderPlus className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("styles.addToCollection")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {collections.map(c => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => {
                      // Find the project we JUST saved. Use imageURL matching.
                      const p = projects.find(proj => proj.imageUrl === resultImage);
                      if (p) {
                        addToCollection(c.id, p.id);
                        toast.success("Added to " + c.title);
                      } else {
                        toast.error("Project not found (sync error)");
                      }
                    }}
                  >
                    {c.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="secondary" size="icon" disabled={!resultImage}><Share2 className="w-4 h-4" /></Button>
        </div>

        <Card className="w-full max-w-[768px] aspect-[3/4] flex items-center justify-center bg-background/60 backdrop-blur border-dashed shadow-sm overflow-hidden relative">
          {resultImage ? (
            <img
              src={resultImage}
              alt="Generated Style"
              className="w-full h-full object-cover animate-in fade-in duration-1000"
            />
          ) : (
            <div className="text-center space-y-4 text-muted-foreground animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4 text-primary">
                {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <ImageIcon className="w-10 h-10" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isGenerating ? t("styles.designing") : t("styles.readyToCreate")}
                </h3>
                <p className="text-sm max-w-xs mx-auto mt-1">
                  {isGenerating ? t("styles.designingDesc") : t("styles.readyToCreateDesc")}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function StylesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <StylesPageContent />
    </Suspense>
  )
}
