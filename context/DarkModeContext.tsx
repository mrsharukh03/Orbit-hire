'use client'

import { createContext, useState, useEffect, ReactNode } from "react";

type DarkModeContextType = {
    darkMode: boolean;
    toggleDarkMode: () => void;
};

export const DarkModeContext = createContext<DarkModeContextType>({
    darkMode: false,
    toggleDarkMode: () => { },
});

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
    const [darkMode, setDarkMode] = useState(false);

    // 🔹 Load dark mode from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("darkMode");
        if (stored === "true") setDarkMode(true);
    }, []);

    // 🔹 Apply dark class and save preference
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");

        localStorage.setItem("darkMode", darkMode.toString());
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};