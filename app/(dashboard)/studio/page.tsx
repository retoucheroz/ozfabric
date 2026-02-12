"use client"

import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

import { useState, useEffect, Suspense } from "react"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Upload, FileText, Ruler, Palette, Loader2, Download, Printer, FolderPlus, Folder, History } from "lucide-react"
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
        description: data.category
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
      <div className={cn("flex flex-col h-auto lg:h-[calc(100vh-60px)] overflow-y-auto lg:overflow-hidden", isExporting ? "hidden" : "print:hidden")}>
        {/* Header toolbar */}


        <div className="flex-1 lg:overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Visual Asset */}
          <div className="w-full lg:w-[420px] lg:border-r bg-background p-4 lg:overflow-y-auto space-y-4 shrink-0 border-b lg:border-b-0">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("studio.title")}</h2>
              <p className="text-muted-foreground text-sm">{t("studio.techAnalysis")}</p>
            </div>

            <Card className="h-32 flex items-center justify-center relative bg-muted/20 border-dashed border-2 rounded-xl hover:border-violet-500 transition-colors shadow-none overflow-hidden group">
              {preview ? (
                <img src={preview} className="h-full w-full object-contain p-2" />
              ) : (
                <div className="text-center p-4 cursor-pointer">
                  <div className="w-8 h-8 bg-background/50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-xs">{t("studio.uploadDesign") || "Upload Design"}</h3>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
            </Card>

            {data && (
              <div className="space-y-4">
                <Card className="p-4 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{language === "tr" ? "Kategori" : "Category"}</span>
                    <div className="font-medium">{data.category}</div>
                  </div>
                </Card>

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
              </div>
            )}
          </div>

          {/* Right: Technical Spec Sheet */}
          <div className="flex-1 bg-white dark:bg-zinc-950 overflow-y-auto p-8 lg:px-12">
            {isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{t("studio.analyzing") || "Analyzing Garment Structure..."}</h3>
                  <p className="text-muted-foreground">{t("studio.extracting") || "Extracting fabric points, measurements, and Pantone codes."}</p>
                </div>
              </div>
            ) : data ? (
              <div id="tech-pack-content" className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white text-black p-8 border border-gray-200 rounded-xl">
                {/* Title Block */}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">{data.productName}</h1>
                  <p className="text-gray-500">{t("studio.techSpecSheet")} • {new Date().getFullYear()} Collection</p>
                </div>

                {/* BOM / Fabric Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-semibold text-black">{language === 'tr' ? 'Kumaş & Yapı' : 'Fabric & Construction'}</h3>
                  </div>
                  <Card className="bg-white border-gray-200 shadow-none">
                    <Table>
                      <TableBody>
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableCell className="font-medium w-[150px] text-gray-900">{language === 'tr' ? 'Ana Kumaş' : 'Main Fabric'}</TableCell>
                          <TableCell className="text-gray-700 p-2">
                            <Input
                              value={data.fabric.main}
                              onChange={(e) => handleFabricChange('main', e.target.value)}
                              className="h-8 border-transparent hover:border-gray-200 focus:border-violet-500 font-normal shadow-none px-2 -ml-2 w-full"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableCell className="font-medium text-gray-900">{language === 'tr' ? 'İçerik' : 'Composition'}</TableCell>
                          <TableCell className="text-gray-700 p-2">
                            <Input
                              value={data.fabric.composition}
                              onChange={(e) => handleFabricChange('composition', e.target.value)}
                              className="h-8 border-transparent hover:border-gray-200 focus:border-violet-500 font-normal shadow-none px-2 -ml-2 w-full"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableCell className="font-medium text-gray-900">{language === 'tr' ? 'Gramaj' : 'Weight'}</TableCell>
                          <TableCell className="text-gray-700 p-2">
                            <Input
                              value={data.fabric.weight}
                              onChange={(e) => handleFabricChange('weight', e.target.value)}
                              className="h-8 border-transparent hover:border-gray-200 focus:border-violet-500 font-normal shadow-none px-2 -ml-2 w-full"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableCell className="font-medium text-gray-900">{language === 'tr' ? 'Kalıp' : 'Fit Type'}</TableCell>
                          <TableCell className="text-gray-700 p-2">
                            <Input
                              value={data?.fit || ""}
                              onChange={(e) => handleFitChange(e.target.value)}
                              className="h-8 border-transparent hover:border-gray-200 focus:border-violet-500 font-normal shadow-none px-2 -ml-2 w-full"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </section>

                {/* Measurements */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Ruler className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-semibold text-black">{language === 'tr' ? 'Ölçü Tablosu (36 Beden)' : 'Key Measurements (Sample 36)'}</h3>
                  </div>
                  <Card className="bg-white border-gray-200 shadow-none">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableHead className="text-gray-500">{language === 'tr' ? 'Ölçüm Noktası' : 'Point of Measure (POM)'}</TableHead>
                          <TableHead className="text-right text-gray-500">{language === 'tr' ? 'Değer (cm)' : 'Value (cm)'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.measurements?.points ? (
                          data.measurements.points.map((m: any, i: number) => (
                            <TableRow key={i} className="border-gray-100 hover:bg-transparent">
                              <TableCell className="text-gray-700 p-2">
                                <Input
                                  value={m.label}
                                  onChange={(e) => handleMeasurementChange(i, 'label', e.target.value)}
                                  className="h-8 border-transparent hover:border-gray-200 focus:border-violet-500 font-normal shadow-none px-2 -ml-2 w-full"
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono text-gray-700 p-2">
                                <Input
                                  value={m.value}
                                  onChange={(e) => handleMeasurementChange(i, 'value', e.target.value)}
                                  className="h-8 text-right border-transparent hover:border-gray-200 focus:border-violet-500 font-normal shadow-none px-2 -ml-2 w-full"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-muted-foreground italic">
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
      </div>

      {/* Printable Tech Pack - Visible only during export/print */}
      {(isExporting || true) && data && (
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
      )}
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
