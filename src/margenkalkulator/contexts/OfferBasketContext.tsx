// ============================================
// Offer Basket Context - Multi-Angebots-Sammlung
// ============================================
//
// ZWECK: Ermöglicht es, mehrere Tarife/Angebote in einem "Warenkorb"
// zu sammeln und gemeinsam als PDF zu exportieren.
//
// ============================================

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { OfferOptionState, CalculationResult } from "../engine/types";

/**
 * Einzelnes Angebot im Basket
 */
export interface BasketItem {
  id: string;
  name: string;
  option: OfferOptionState;
  result: CalculationResult;
  addedAt: Date;
}

/**
 * Kundeninformationen für das Angebot
 */
export interface OfferCustomerInfo {
  // Kontaktdaten (links im Formular)
  firma: string;
  anrede: "Herr" | "Frau" | "Divers" | "";
  vorname: string;
  nachname: string;
  land: string;
  plz: string;
  ort: string;
  strasse: string;
  hausnummer: string;
  
  // Ansprechpartner (rechts im Formular)
  apName: string;
  apAnrede: "Herr" | "Frau" | "Divers" | "";
  apVorname: string;
  apNachname: string;
  apLand: string;
  apPlz: string;
  apOrt: string;
  apStrasse: string;
  apHausnummer: string;
  apTelefon: string;
  apFax: string;
  apMobil: string;
  apEmail: string;
  apWebseite: string;
}

/**
 * Angebots-Optionen
 */
export interface OfferOptions {
  hideProviderName: boolean;  // Versorgernamen ausblenden
  hideTariffName: boolean;    // Tarifnamen ausblenden
}

/**
 * Vollständige Angebots-Konfiguration
 */
export interface OfferConfig {
  customer: OfferCustomerInfo;
  options: OfferOptions;
  anschreiben: string;        // Einleitungstext
  angebotstext: string;       // Text nach Tarifübersicht
  items: BasketItem[];
  createdAt: Date;
}

/**
 * Standard-Kundeninfo
 */
export const DEFAULT_CUSTOMER_INFO: OfferCustomerInfo = {
  firma: "",
  anrede: "",
  vorname: "",
  nachname: "",
  land: "Deutschland",
  plz: "",
  ort: "",
  strasse: "",
  hausnummer: "",
  apName: "",
  apAnrede: "",
  apVorname: "",
  apNachname: "",
  apLand: "Deutschland",
  apPlz: "",
  apOrt: "",
  apStrasse: "",
  apHausnummer: "",
  apTelefon: "",
  apFax: "",
  apMobil: "",
  apEmail: "",
  apWebseite: "",
};

/**
 * Standard-Optionen
 */
export const DEFAULT_OFFER_OPTIONS: OfferOptions = {
  hideProviderName: false,
  hideTariffName: false,
};

/**
 * Context Interface
 */
interface OfferBasketContextType {
  items: BasketItem[];
  itemCount: number;
  
  // Basket-Operationen
  addItem: (name: string, option: OfferOptionState, result: CalculationResult) => void;
  removeItem: (id: string) => void;
  clearBasket: () => void;
  
  // Modal-State
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // Aktueller Angebots-State
  customer: OfferCustomerInfo;
  setCustomer: (info: OfferCustomerInfo) => void;
  options: OfferOptions;
  setOptions: (opts: OfferOptions) => void;
  anschreiben: string;
  setAnschreiben: (text: string) => void;
  angebotstext: string;
  setAngebotstext: (text: string) => void;
  
  // Finales Angebot erstellen
  createOfferConfig: () => OfferConfig;
  resetOffer: () => void;
}

const OfferBasketContext = createContext<OfferBasketContextType | null>(null);

/**
 * Provider für den Offer Basket
 */
export function OfferBasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customer, setCustomer] = useState<OfferCustomerInfo>(DEFAULT_CUSTOMER_INFO);
  const [options, setOptions] = useState<OfferOptions>(DEFAULT_OFFER_OPTIONS);
  const [anschreiben, setAnschreiben] = useState("");
  const [angebotstext, setAngebotstext] = useState(
    "Aufgrund der Bedarfsanalyse ist das vorstehende unverbindliche Angebot erstellt worden. " +
    "Für einen entsprechenden Vertragsabschluss ist die Unterzeichnung der Auftragsdokumente durch Sie und durch Vodafone erforderlich. " +
    "Preise/Rabatte im Angebot werden zur Verbesserung der Darstellung auf zwei Nachkommastellen gerundet. " +
    "Technische Änderungen und Irrtümer vorbehalten."
  );

  const addItem = useCallback((name: string, option: OfferOptionState, result: CalculationResult) => {
    const newItem: BasketItem = {
      id: crypto.randomUUID(),
      name,
      option,
      result,
      addedAt: new Date(),
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearBasket = useCallback(() => {
    setItems([]);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const createOfferConfig = useCallback((): OfferConfig => {
    return {
      customer,
      options,
      anschreiben,
      angebotstext,
      items: [...items],
      createdAt: new Date(),
    };
  }, [customer, options, anschreiben, angebotstext, items]);

  const resetOffer = useCallback(() => {
    setItems([]);
    setCustomer(DEFAULT_CUSTOMER_INFO);
    setOptions(DEFAULT_OFFER_OPTIONS);
    setAnschreiben("");
    setAngebotstext(
      "Aufgrund der Bedarfsanalyse ist das vorstehende unverbindliche Angebot erstellt worden. " +
      "Für einen entsprechenden Vertragsabschluss ist die Unterzeichnung der Auftragsdokumente durch Sie und durch Vodafone erforderlich. " +
      "Preise/Rabatte im Angebot werden zur Verbesserung der Darstellung auf zwei Nachkommastellen gerundet. " +
      "Technische Änderungen und Irrtümer vorbehalten."
    );
    setIsModalOpen(false);
  }, []);

  const value = useMemo(() => ({
    items,
    itemCount: items.length,
    addItem,
    removeItem,
    clearBasket,
    isModalOpen,
    openModal,
    closeModal,
    customer,
    setCustomer,
    options,
    setOptions,
    anschreiben,
    setAnschreiben,
    angebotstext,
    setAngebotstext,
    createOfferConfig,
    resetOffer,
  }), [
    items, addItem, removeItem, clearBasket, 
    isModalOpen, openModal, closeModal,
    customer, options, anschreiben, angebotstext,
    createOfferConfig, resetOffer
  ]);

  return (
    <OfferBasketContext.Provider value={value}>
      {children}
    </OfferBasketContext.Provider>
  );
}

/**
 * Hook zum Verwenden des Offer Basket
 */
export function useOfferBasket() {
  const context = useContext(OfferBasketContext);
  if (!context) {
    throw new Error("useOfferBasket must be used within an OfferBasketProvider");
  }
  return context;
}
