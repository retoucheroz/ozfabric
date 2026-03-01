"use client"

import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

import { useState, useEffect, Suspense } from "react"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Upload,
  FileText,
  Ruler,
  Palette,
  Loader2,
  Download,
  Printer,
  FolderPlus,
  Folder,
  History,
  X,
  ChevronRight
} from "lucide-react"
import {
  TbAdjustments,
  TbFileText,
  TbRuler2,
  TbPalette,
  TbPhoto,
  TbDownload,
  TbPrinter,
  TbFolder,
  TbSparkles,
  TbLoader2,
  TbChevronRight,
  TbHistory,
  TbChartBar,
  TbSettings,
  TbHelp
} from "react-icons/tb"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/context/projects-context"
import { toast } from "sonner"




function StudioPageContent() {
  const searchParams = useSearchParams();
  const { collections, addToCollection, projects, addProject, updateProject } = useProjects();
  const { t, language } = useLanguage();

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const img = searchParams.get("image");
    if (img) {
      setPreview(img);
      analyzeImage(img);
    }
  }, [searchParams]);

  // ... (existing effects)


  const currentProject = projects.find(p => p.imageUrl === preview);
  useEffect(() => {
    if (currentProject?.description && !notes) {
      setNotes(currentProject.description);
    }
  }, [currentProject]);

  const handleNotesBlur = () => {
    if (currentProject) {
      updateProject(currentProject.id, { description: notes });
      toast.success("Notes saved to project");
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      await analyzeImage(selectedFile);
    }
  };

  const analyzeImage = async (source: File | string) => {
    setIsAnalyzing(true);
    try {
      let imageData = "";

      // Helper to resize image
      const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = base64Str;
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxWidth) {
              if (width > height) {
                height *= maxWidth / width;
                width = maxWidth;
              } else {
                width *= maxWidth / height;
                height = maxWidth;
              }
            } else {
              resolve(base64Str);
              return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // Convert to jpeg with 0.8 quality to assume safe size
          };
          img.onerror = () => resolve(base64Str); // Fallback to original
        });
      };

      if (source instanceof File) {
        const reader = new FileReader();
        const rawBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(source);
        });
        imageData = await resizeImage(rawBase64);

      } else if (typeof source === "string") {
        if (source.startsWith("data:")) {
          imageData = await resizeImage(source);
        } else {
          // Fetch URL and convert to base64
          try {
            const response = await fetch(source);
            const blob = await response.blob();
            const reader = new FileReader();
            const rawBase64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            imageData = await resizeImage(rawBase64);
          } catch (e) {
            console.error("Failed to fetch image from URL", e);
            toast.error(t("common.error") || "Error loading image");
            setIsAnalyzing(false);
            return;
          }
        }
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          language,
          type: 'techPack'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed");
      }

      if (result.status === "success") {
        setData(result.data);
        if (result.data.designNotes) {
          setNotes(result.data.designNotes);
        }
        toast.success(t("studio.analysisSuccess") || "Design analyzed successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : (t("studio.analysisFailed") || "Failed to analyze design"));
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleFabricChange = (field: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      fabric: {
        ...prev.fabric,
        [field]: value
      }
    }));
  };

  const handleFitChange = (value: string) => {
    setData((prev: any) => ({
      ...prev,
      fit: value
    }));
  };

  const handleMeasurementChange = (index: number, field: 'label' | 'value', value: string) => {
    setData((prev: any) => {
      const newPoints = [...prev.measurements.points];
      newPoints[index] = { ...newPoints[index], [field]: value };
      return {
        ...prev,
        measurements: {
          ...prev.measurements,
          points: newPoints
        }
      };
    });
  };

  const handleAddToCollection = (collectionId: string) => {
    // Find project ID by preview URL
    let project = projects.find(p => p.imageUrl === preview);
    let projectId = project?.id;

    if (!projectId) {
      // Create new project if it doesn't exist (direct upload)
      if (!data || !preview) {
        toast.error(t("studio.analysisFailed") || "Analysis required first.");
        return;
      }

      const newId = addProject({
        title: data.productName || "New Tech Pack",
        imageUrl: preview,
        type: "Tech Pack",
        description: data.category,
        mediaType: "image"
      });
      projectId = newId;
    }

    addToCollection(collectionId, projectId);
    toast.success(t("studio.addedToCollection"));
    setIsCollectionOpen(false);
  }



  if (!mounted) return null;

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0F]">
        {/* Header Area */}
        <div className="h-20 border-b border-white/5 bg-[#0D0D0F] flex items-center justify-between px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-xl">
              <TbChartBar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">PRODUCT STUDIO</h1>
              <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-1.5 grayscale opacity-70">AI PRODUCT INFORMATION & TECH SPECS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white transition-colors">
              <TbSettings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white transition-colors">
              <TbHelp className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 lg:overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Visual Asset */}
          <div className="w-full lg:w-[420px] lg:border-r border-white/5 bg-[#0D0D0F] p-8 lg:overflow-y-auto space-y-8 shrink-0 border-b lg:border-b-0">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-none">{t("studio.title")}</h2>
              <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-2">{t("studio.techAnalysis")}</p>
            </div>

            <section className="space-y-4">
              <Label className="text-[10px] uppercase font-black tracking-widest text-white px-1 flex items-center gap-2">
                <TbPhoto className="w-4 h-4" />
                {language === "tr" ? "ÜRÜN GÖRÜNÜMÜ" : "PRODUCT VIEW"}
              </Label>
              <div className="border-2 border-dashed rounded-2xl h-56 border-white/5 hover:border-white/20 transition-all relative group overflow-hidden cursor-pointer bg-white/[0.02]">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                />
                {preview ? (
                  <img src={preview} className="w-full h-full object-contain p-4 grayscale group-hover:grayscale-0 transition-all" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <TbPhoto className="w-6 h-6 opacity-30" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t("studio.uploadRef") || "Upload Product Image"}</span>
                  </div>
                )}
              </div>
            </section>

            {data && (
              <div className="grid grid-cols-1 gap-2">
                <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={!data}>
                      <FolderPlus className="w-4 h-4 mr-2" /> {t("studio.addToCollection")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>{t("studio.selectCollection")}</DialogTitle>
                    <DialogDescription>{t("studio.addToMoodboard")}</DialogDescription>
                    <div className="grid gap-2 mt-4">
                      {collections.map(c => (
                        <Button key={c.id} variant="ghost" className="justify-start" onClick={() => handleAddToCollection(c.id)}>
                          <Folder className="w-4 h-4 mr-2" />
                          {c.title}
                        </Button>
                      ))}
                      {collections.length === 0 && <p className="text-center text-muted-foreground text-sm">No collections created yet.</p>}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full justify-start" disabled={!data} onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> {t("studio.print")}
                </Button>

              </div>
            )}
          </div>

          <div className="flex-1 bg-[#0D0D0F] overflow-y-auto p-8 lg:p-16">
            {isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-20">
                <Loader2 className="w-16 h-16 animate-spin text-white" />
                <div className="text-center">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-3">{t("studio.analyzing") || "Analyzing Garment..."}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-relaxed">{t("studio.extracting") || "EXTRACTING FABRIC POINTS, MEASUREMENTS, AND PANTONE CODES."}</p>
                </div>
              </div>
            ) : data ? (
              <div id="tech-pack-content" className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white text-black p-12 shadow-2xl rounded-3xl border border-gray-100">
                {/* Title Block */}
                <div className="border-b-4 border-black pb-8">
                  <h1 className="text-5xl font-black tracking-tighter uppercase italic mb-2 text-black">{data.productName}</h1>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{t("studio.techSpecSheet")} • {new Date().getFullYear()} COLLECTION</p>
                </div>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">{language === 'tr' ? 'KUMAŞ & YAPI' : 'FABRIC & CONSTRUCTION'}</h3>
                  </div>
                  <Card className="bg-transparent border-gray-200 shadow-none rounded-2xl overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow className="border-gray-100 hover:bg-gray-50/50">
                          <TableCell className="font-black text-[10px] uppercase tracking-widest w-[180px] text-gray-400 border-r border-gray-100">{language === 'tr' ? 'ANA KUMAŞ' : 'MAIN FABRIC'}</TableCell>
                          <TableCell className="p-4">
                            <Input
                              value={data.fabric.main}
                              onChange={(e) => handleFabricChange('main', e.target.value)}
                              className="h-9 border-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-black font-bold text-sm shadow-none px-3 w-full transition-all"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-gray-100 hover:bg-gray-50/50">
                          <TableCell className="font-black text-[10px] uppercase tracking-widest text-gray-400 border-r border-gray-100">{language === 'tr' ? 'İÇERİK' : 'COMPOSITION'}</TableCell>
                          <TableCell className="p-4">
                            <Input
                              value={data.fabric.composition}
                              onChange={(e) => handleFabricChange('composition', e.target.value)}
                              className="h-9 border-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-black font-bold text-sm shadow-none px-3 w-full transition-all"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-gray-100 hover:bg-gray-50/50">
                          <TableCell className="font-black text-[10px] uppercase tracking-widest text-gray-400 border-r border-gray-100">{language === 'tr' ? 'GRAMAJ' : 'WEIGHT'}</TableCell>
                          <TableCell className="p-4">
                            <Input
                              value={data.fabric.weight}
                              onChange={(e) => handleFabricChange('weight', e.target.value)}
                              className="h-9 border-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-black font-bold text-sm shadow-none px-3 w-full transition-all"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-gray-100 hover:bg-gray-50/50">
                          <TableCell className="font-black text-[10px] uppercase tracking-widest text-gray-400 border-r border-gray-100">{language === 'tr' ? 'KALIP' : 'FIT TYPE'}</TableCell>
                          <TableCell className="p-4">
                            <Input
                              value={data?.fit || ""}
                              onChange={(e) => handleFitChange(e.target.value)}
                              className="h-9 border-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-black font-bold text-sm shadow-none px-3 w-full transition-all"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">{language === 'tr' ? 'ÖLÇÜ TABLOSU (36 BEDEN)' : 'KEY MEASUREMENTS (SAMPLE 36)'}</h3>
                  </div>
                  <Card className="bg-transparent border-gray-200 shadow-none rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-gray-400 h-10">{language === 'tr' ? 'ÖLÇÜM NOKTASI' : 'POINT OF MEASURE (POM)'}</TableHead>
                          <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-gray-400 h-10">{language === 'tr' ? 'DEĞER (CM)' : 'VALUE (CM)'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.measurements?.points ? (
                          data.measurements.points.map((m: any, i: number) => (
                            <TableRow key={i} className="border-gray-100 hover:bg-gray-50/50">
                              <TableCell className="p-4">
                                <Input
                                  value={m.label}
                                  onChange={(e) => handleMeasurementChange(i, 'label', e.target.value)}
                                  className="h-9 border-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-black font-bold text-sm shadow-none px-3 w-full transition-all"
                                />
                              </TableCell>
                              <TableCell className="text-right p-4">
                                <Input
                                  value={m.value}
                                  onChange={(e) => handleMeasurementChange(i, 'value', e.target.value)}
                                  className="h-9 text-right border-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-black font-mono font-black text-sm shadow-none px-3 w-full transition-all"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-12 text-gray-400 text-[10px] font-black uppercase tracking-widest italic">
                              {language === 'tr' ? 'Ölçü verisi bulunamadı' : 'No measurement data found'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </section>

                {/* Colors */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-semibold text-black">{language === 'tr' ? 'Renkler & Pantone' : 'Colorway & Pantone'}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data?.colors ? (
                      data.colors.map((c: any, i: number) => (
                        <Card key={i} className="p-3 flex items-center gap-4 bg-white border-gray-200 shadow-none">
                          <div
                            className="w-12 h-12 rounded-full border border-gray-200 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                          <div>
                            <div className="font-bold text-sm text-black">{c.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{c.pantone}</div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic col-span-2">
                        {language === 'tr' ? 'Renk verisi bulunamadı' : 'No color data found'}
                      </p>
                    )}
                  </div>
                </section>

                {/* Construction Notes */}
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-black">{language === 'tr' ? 'Üretim Notları' : 'Assembly Notes'}</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 border-l-2 border-gray-200 pl-4">
                    {data?.constructionDetails ? (
                      data.constructionDetails.map((note: string, i: number) => (
                        <li key={i}>{note}</li>
                      ))
                    ) : (
                      <li className="italic text-muted-foreground">{language === 'tr' ? 'Üretim notu bulunamadı' : 'No construction notes found'}</li>
                    )}
                  </ul>
                </section>

                {/* Design Notes (User Input) */}
                <section className="print:block">
                  <h3 className="text-lg font-semibold mb-4 text-black">{t("studio.designerNotes")}</h3>
                  <Textarea
                    placeholder={t("studio.notesPlaceholder")}
                    className="min-h-[100px] bg-white border-gray-200 text-black placeholder:text-gray-400"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                  />
                  <p className="text-xs text-gray-400 mt-2">{language === 'tr' ? 'Notlar otomatik olarak PDF dosyasına eklenir.' : 'Notes are automatically included in the Tech Pack PDF.'}</p>
                </section>

                <div className="h-12" /> {/* Spacer */}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <FileText className="w-16 h-16 mb-4 stroke-1" />
                <p>{t("studio.uploadToAnalyze") || "Upload a design to generate Technical Analysis"}</p>
              </div>
            )}
          </div>
        </div>
      </div >

      {/* Printable Tech Pack - Visible only during export/print */}
      {
        (isExporting || true) && data && (
          <div id="printable-tech-pack" className={cn("mx-auto bg-white text-black p-[10mm]", isExporting ? "fixed top-0 left-0 w-screen h-screen z-[9999] overflow-auto" : "hidden print:block")}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-black pb-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-wider">{data.productName}</h1>
                <div className="text-sm mt-1 flex gap-4 text-gray-600">
                  <span>{data.sku}</span>
                  <span>•</span>
                  <span>{new Date().getFullYear()} Collection</span>
                  <span>•</span>
                  <span>{data.category}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg tracking-wider">TECH PACK</div>
                <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Column: Image */}
              <div className="aspect-[3/4] relative border border-gray-200 bg-gray-50 rounded-lg overflow-hidden">
                {preview ? (
                  <img src={preview} className="w-full h-full object-contain mix-blend-multiply" alt="Product" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
              </div>

              {/* Right Column: Key Specs */}
              <div className="space-y-6">
                {/* Fabric Table */}
                <div>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'KUMAŞ DETAYLARI' : 'FABRICATION'}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1 text-gray-500 w-24">Main Fabric</td><td className="font-medium">{data.fabric.main}</td></tr>
                      <tr><td className="py-1 text-gray-500">Composition</td><td className="font-medium">{data.fabric.composition}</td></tr>
                      <tr><td className="py-1 text-gray-500">Weight</td><td className="font-medium">{data.fabric.weight}</td></tr>
                      <tr><td className="py-1 text-gray-500">Finish</td><td className="font-medium">{data.fabric.finish}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Colors */}
                <div>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'RENKLER' : 'COLORWAY'}</h3>
                  <div className="space-y-2">
                    {data?.colors ? (
                      data.colors.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: c.hex, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as any} />
                          <div>
                            <div className="font-bold text-sm">{c.name}</div>
                            <div className="text-xs text-gray-500">{c.pantone}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No colors identified</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'NOTLAR' : 'NOTES'}</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {data?.constructionDetails ? (
                      data.constructionDetails.slice(0, 4).map((note: string, i: number) => (
                        <li key={i}>{note}</li>
                      ))
                    ) : (
                      <li className="italic text-gray-400">No notes available</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Measurements Table (Full Width) */}
            <div className="mb-8">
              <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'ÖLÇÜ TABLOSU' : 'MEASUREMENTS'}</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="py-2 px-3 border border-gray-200">Point of Measure</th>
                    <th className="py-2 px-3 border border-gray-200 w-32 text-right">{language === 'tr' ? 'Değer (cm)' : 'Value (cm)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.measurements?.points ? (
                    data.measurements.points.map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 px-3 border border-gray-200">{m.label}</td>
                        <td className="py-2 px-3 border border-gray-200 text-right font-mono">{m.value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-400 italic border border-gray-200">
                        No measurements available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Designer Notes */}
            {notes && (
              <div className="mb-8">
                <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">Designer Comments</h3>
                <p className="text-sm p-3 bg-gray-50 rounded border border-gray-200 italic">{notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-black flex justify-between text-xs text-gray-400">
              <div>{language === 'tr' ? 'Teknik Şartname Belgesi' : 'Technical Specification Sheet'}</div>
              <div>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        )
      }
    </>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <StudioPageContent />
    </Suspense>
  )
}
