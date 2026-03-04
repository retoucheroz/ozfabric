"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { dbOperations, STORES } from "@/lib/db"

export type Project = {
    id: string;
    type: "Style" | "Pattern" | "Try-On" | "Ghost" | "Tech Pack" | "Expand" | "Upscale" | "Retexture" | "Photoshoot" | "Sketch" | "Editorial" | "Video" | "Product";
    title: string;
    imageUrl: string;
    createdAt: number;
    description?: string;
    isFavorite?: boolean;
    mediaType?: "image" | "video";
}

export type Collection = {
    id: string;
    title: string;
    description?: string;
    projectIds: string[];
    coverImage?: string;
    createdAt: number;
}

export type TrainingType = "model" | "brand" | "garment" | "pose";

export type TrainedModel = {
    id: string;
    name: string;
    type: TrainingType;
    status: "ready" | "training" | "queued";
    progress?: number;
    images: number;
    createdAt: number; // Changed to number for consistency
    triggerWord?: string; // For Fal.ai
    thumbnailUrl?: string;
}

interface ProjectsContextType {
    projects: Project[];
    collections: Collection[];
    models: TrainedModel[];
    credits: number;
    addProject: (project: Omit<Project, "id" | "createdAt">) => string;
    addCollection: (collection: Omit<Collection, "id" | "createdAt">) => string;
    addModel: (model: Omit<TrainedModel, "id" | "createdAt">) => string;
    addToCollection: (collectionId: string, projectId: string) => void;
    removeFromCollection: (collectionId: string, projectId: string) => void;
    deleteCollection: (id: string) => void;
    updateCollection: (id: string, updates: Partial<Collection>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    deleteModel: (id: string) => void;
    deductCredits: (amount: number) => Promise<boolean>;
    addCredits: (amount: number) => void;
    refreshCredits: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [models, setModels] = useState<TrainedModel[]>([]);
    const [credits, setCredits] = useState(0);

    // Load and Migrate on mount
    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Check for legacy LocalStorage data
                const lsProjects = localStorage.getItem("modeon_projects");
                const lsCollections = localStorage.getItem("modeon_collections");
                const lsModels = localStorage.getItem("modeon_models");

                // 2. Load from IndexedDB
                const idbProjects = await dbOperations.getAll<Project>(STORES.PROJECTS);
                const idbCollections = await dbOperations.getAll<Collection>(STORES.COLLECTIONS);
                const idbModels = await dbOperations.getAll<TrainedModel>(STORES.MODELS);

                // 3. Simple Migration Strategy: If IDB is empty but LS has data, use LS and sync to IDB
                if (idbProjects.length === 0 && lsProjects) {
                    const parsed = JSON.parse(lsProjects);
                    setProjects(parsed);
                    // Sync to IDB in background
                    parsed.forEach((p: any) => dbOperations.add(STORES.PROJECTS, p));
                    localStorage.removeItem("modeon_projects"); // Clear to prevent loops
                } else {
                    setProjects(idbProjects);
                }

                if (idbCollections.length === 0 && lsCollections) {
                    const parsed = JSON.parse(lsCollections);
                    setCollections(parsed);
                    parsed.forEach((c: any) => dbOperations.add(STORES.COLLECTIONS, c));
                    localStorage.removeItem("modeon_collections");
                } else {
                    setCollections(idbCollections);
                }

                if (idbModels.length === 0 && lsModels) {
                    const parsed = JSON.parse(lsModels);
                    setModels(parsed);
                    parsed.forEach((m: any) => dbOperations.add(STORES.MODELS, m));
                    localStorage.removeItem("modeon_models");
                } else {
                    setModels(idbModels);
                }
            } catch (err) {
                console.error("Failed to initialize projects data from DB:", err);
            }
        };

        initData();
        refreshCredits();
    }, []);

    const refreshCredits = async () => {
        try {
            const res = await fetch('/api/auth/session');
            if (res.ok) {
                const data = await res.json();
                if (data?.user) {
                    setCredits(data.user.credits || 0);
                    console.log(`💳 Credits Refreshed: ${data.user.credits}`);
                }
            }
        } catch (e) {
            console.error("Failed to fetch credits:", e);
        }
    };

    // Auto-refresh credits on focus
    useEffect(() => {
        const handleFocus = () => refreshCredits();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Individual persistence helpers (don't save entire arrays on every tiny update)
    const persistProject = (p: Project) => dbOperations.add(STORES.PROJECTS, p);
    const persistCollection = (c: Collection) => dbOperations.add(STORES.COLLECTIONS, c);
    const persistModel = (m: TrainedModel) => dbOperations.add(STORES.MODELS, m);

    const addProject = (project: Omit<Project, "id" | "createdAt">): string => {
        const id = crypto.randomUUID();
        const newProject: Project = {
            ...project,
            id,
            createdAt: Date.now(),
        };
        setProjects((prev) => [newProject, ...prev]);
        persistProject(newProject);
        return id;
    };

    const addCollection = (collection: Omit<Collection, "id" | "createdAt">): string => {
        const id = crypto.randomUUID();
        const newCollection: Collection = {
            ...collection,
            id,
            createdAt: Date.now(),
        };
        setCollections((prev) => [newCollection, ...prev]);
        persistCollection(newCollection);
        return id;
    };

    const addModel = (model: Omit<TrainedModel, "id" | "createdAt">): string => {
        const id = crypto.randomUUID();
        const newModel: TrainedModel = {
            ...model,
            id,
            createdAt: Date.now(),
        };
        setModels((prev) => [newModel, ...prev]);
        persistModel(newModel);
        return id;
    };

    const addToCollection = (collectionId: string, projectId: string) => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId && !c.projectIds.includes(projectId)) {
                const updated = { ...c, projectIds: [...c.projectIds, projectId] };
                persistCollection(updated);
                return updated;
            }
            return c;
        }));
    };

    const removeFromCollection = (collectionId: string, projectId: string) => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                const updated = { ...c, projectIds: c.projectIds.filter(id => id !== projectId) };
                persistCollection(updated);
                return updated;
            }
            return c;
        }));
    };

    const deleteCollection = (id: string) => {
        setCollections(prev => prev.filter(c => c.id !== id));
        dbOperations.delete(STORES.COLLECTIONS, id);
    };

    const updateCollection = (id: string, updates: Partial<Collection>) => {
        setCollections(prev => prev.map(c => {
            if (c.id === id) {
                const updated = { ...c, ...updates };
                persistCollection(updated);
                return updated;
            }
            return c;
        }));
    };

    const deleteProject = (id: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        dbOperations.delete(STORES.PROJECTS, id);
    };

    const deleteModel = (id: string) => {
        setModels((prev) => prev.filter((m) => m.id !== id));
        dbOperations.delete(STORES.MODELS, id);
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects((prev) => prev.map((p) => {
            if (p.id === id) {
                const updated = { ...p, ...updates };
                persistProject(updated);
                return updated;
            }
            return p;
        }));
    };

    const deductCredits = async (amount: number): Promise<boolean> => {
        try {
            const res = await fetch('/api/user/credits/deduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });

            if (res.ok) {
                const data = await res.json();
                setCredits(data.newBalance);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Deduct credits failed:", e);
            return false;
        }
    };

    const addCredits = (amount: number) => {
        // This is now purely client-side UI mock for legacy components
        // Real credits are added via Admin Panel -> /api/admin/users
        setCredits(prev => prev + amount);
    };

    return (
        <ProjectsContext.Provider value={{ projects, collections, models, credits, addProject, addCollection, addModel, addToCollection, removeFromCollection, deleteCollection, updateCollection, updateProject, deleteProject, deleteModel, deductCredits, addCredits, refreshCredits }}>
            {children}
        </ProjectsContext.Provider>
    );
}

export function useProjects() {
    const context = useContext(ProjectsContext);
    if (context === undefined) {
        throw new Error("useProjects must be used within a ProjectsProvider");
    }
    return context;
}
