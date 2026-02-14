"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
    isExpanded: boolean;
    toggleSidebar: () => void;
    setIsExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-expanded');
        if (saved !== null) {
            setIsExpanded(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('sidebar-expanded', String(newState));
    };

    const handleSetIsExpanded = (expanded: boolean) => {
        setIsExpanded(expanded);
        localStorage.setItem('sidebar-expanded', String(expanded));
    };

    return (
        <SidebarContext.Provider value={{ isExpanded, toggleSidebar, setIsExpanded: handleSetIsExpanded }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within SidebarProvider");
    return context;
}
