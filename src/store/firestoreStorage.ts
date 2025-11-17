// src/store/firestoreStorage.ts
// Storage adapter para usar Firestore com zustand persist
import { 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../config/firebase";

const STORAGE_KEY = "txt-book-projects";
const STORAGE_DOC_ID = "projects-state";

// Converter Firestore Timestamp para Date
function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) return obj.toDate();
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertTimestamps(obj[key]);
    }
    return result;
  }
  return obj;
}

// Converter Date para Firestore Timestamp
function convertDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return Timestamp.fromDate(obj);
  if (Array.isArray(obj)) return obj.map(convertDates);
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertDates(obj[key]);
    }
    return result;
  }
  return obj;
}

// Storage adapter para Firestore
export const firestoreStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (name !== STORAGE_KEY) return null;
      
      const docRef = doc(db, "zustand-storage", STORAGE_DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      const value = data?.value;
      
      if (!value) return null;
      
      // Converter Timestamps para Dates
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      const converted = convertTimestamps(parsed);
      
      return JSON.stringify(converted);
    } catch (error) {
      console.error("Erro ao ler do Firestore:", error);
      // Fallback para localStorage se Firestore falhar
      return localStorage.getItem(name);
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (name !== STORAGE_KEY) return;
      
      // Converter Dates para Timestamps
      const parsed = JSON.parse(value);
      const converted = convertDates(parsed);
      
      const docRef = doc(db, "zustand-storage", STORAGE_DOC_ID);
      await setDoc(docRef, {
        key: name,
        value: converted,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      // Fallback para localStorage se Firestore falhar
      localStorage.setItem(name, value);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      if (name !== STORAGE_KEY) return;
      
      const docRef = doc(db, "zustand-storage", STORAGE_DOC_ID);
      await setDoc(docRef, {
        key: name,
        value: null,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao remover do Firestore:", error);
      // Fallback para localStorage se Firestore falhar
      localStorage.removeItem(name);
    }
  },
};

