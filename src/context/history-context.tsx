
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { HistoryItem } from "@/components/scan-history";

interface HistoryContextType {
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("scanHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not load scan history from localStorage", error);
    }
  }, []);

  const addHistoryItem = useCallback((newItem: HistoryItem) => {
    setHistory((prevHistory) => {
      const newHistory = [newItem, ...prevHistory].slice(0, 50); // Keep last 50 scans
      try {
        localStorage.setItem("scanHistory", JSON.stringify(newHistory));
      } catch (error) {
        console.error("Could not save scan history to localStorage", error);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem("scanHistory");
    } catch (error) {
      console.error("Could not clear scan history from localStorage", error);
    }
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addHistoryItem, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
