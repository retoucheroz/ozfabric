"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type Project = {
    id: string;
    type: "Style" | "Pattern" | "Try-On" | "Ghost" | "Tech Pack" | "Expand" | "Upscale" | "Retexture" | "Photoshoot" | "Sketch";
    title: string;
    imageUrl: string;
    createdAt: number;
    description?: string;
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
    deductCredits: (amount: number) => boolean;
    addCredits: (amount: number) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [models, setModels] = useState<TrainedModel[]>([]);
    const [credits, setCredits] = useState(100);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedProjects = localStorage.getItem("ozfabric_projects");
        const savedCollections = localStorage.getItem("ozfabric_collections");
        const savedModels = localStorage.getItem("ozfabric_models");
        const savedCredits = localStorage.getItem("ozfabric_credits");

        if (savedProjects) {
            try { setProjects(JSON.parse(savedProjects)); } catch (e) { console.error(e); }
        } else {
            // Seed Data
            setProjects([
                { id: "1", title: "Summer Silk Dress", type: "Style", imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80", createdAt: Date.now() - 10000000 },
                { id: "2", title: "Floral Pattern V2", type: "Pattern", imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80", createdAt: Date.now() - 20000000 },
            ]);
        }

        if (savedCollections) {
            try { setCollections(JSON.parse(savedCollections)); } catch (e) { console.error(e); }
        } else {
            setCollections([{ id: "c1", title: "Summer 2026", projectIds: ["1"], createdAt: Date.now(), description: "Main Collection" }]);
        }

        if (savedModels) {
            try { setModels(JSON.parse(savedModels)); } catch (e) { console.error(e); }
        } else {
            setModels([
                { id: "m1", name: "Summer 2024 Style", type: "brand", status: "ready", images: 25, createdAt: Date.now() - 86400000, triggerWord: "OHWX style", thumbnailUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop" },
                { id: "m2", name: "Studio Poses Set", type: "pose", status: "ready", images: 40, createdAt: Date.now() - 172800000, triggerWord: "pose", thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=300&fit=crop" },
                { id: "m3", name: "Denim Collection", type: "garment", status: "training", progress: 67, images: 30, createdAt: Date.now(), triggerWord: "denim", thumbnailUrl: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&h=300&fit=crop" },
            ]);
        }

        if (savedCredits) {
            setCredits(parseInt(savedCredits));
        }
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (projects.length > 0) localStorage.setItem("ozfabric_projects", JSON.stringify(projects));
        if (collections.length > 0) localStorage.setItem("ozfabric_collections", JSON.stringify(collections));
        if (models.length > 0) localStorage.setItem("ozfabric_models", JSON.stringify(models));
        localStorage.setItem("ozfabric_credits", credits.toString());
    }, [projects, credits, collections, models]);

    const addProject = (project: Omit<Project, "id" | "createdAt">): string => {
        const id = crypto.randomUUID();
        const newProject: Project = {
            ...project,
            id,
            createdAt: Date.now(),
        };
        setProjects((prev) => [newProject, ...prev]);
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
        return id;
    };

    const addToCollection = (collectionId: string, projectId: string) => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId && !c.projectIds.includes(projectId)) {
                return { ...c, projectIds: [...c.projectIds, projectId] };
            }
            return c;
        }));
    };

    const removeFromCollection = (collectionId: string, projectId: string) => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                return { ...c, projectIds: c.projectIds.filter(id => id !== projectId) };
            }
            return c;
        }));
    };

    const deleteCollection = (id: string) => {
        setCollections(prev => prev.filter(c => c.id !== id));
    };

    const updateCollection = (id: string, updates: Partial<Collection>) => {
        setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteProject = (id: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
    };

    const deleteModel = (id: string) => {
        setModels((prev) => prev.filter((m) => m.id !== id));
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    };

    const deductCredits = (amount: number): boolean => {
        if (credits >= amount) {
            setCredits(prev => prev - amount);
            return true;
        }
        return false;
    };

    const addCredits = (amount: number) => {
        setCredits(prev => prev + amount);
    };

    return (
        <ProjectsContext.Provider value={{ projects, collections, models, credits, addProject, addCollection, addModel, addToCollection, removeFromCollection, deleteCollection, updateCollection, updateProject, deleteProject, deleteModel, deductCredits, addCredits }}>
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
