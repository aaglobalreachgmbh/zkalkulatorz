import { createDefaultOptionState } from "@/margenkalkulator/engine";
import type { Customer } from "@/margenkalkulator/hooks/useCustomers";
import type { CustomerContract, ContractWithCustomer } from "@/margenkalkulator/hooks/useCustomerContracts";
import type { CloudOffer } from "@/margenkalkulator/storage/types";
import { useEffect, useState } from "react";
import {
  DEMO_COMPANY_CONTRACTS,
  DEMO_COMPANY_CUSTOMERS,
  DEMO_COMPANY_OFFERS,
} from "./demoDataset";

const EVENT = "demo-workspace-changed";
const PREFIX = "demo-workspace";

export interface DemoWorkspaceState {
  customers: Customer[];
  offers: CloudOffer[];
  contracts: ContractWithCustomer[];
}

const statusMap = {
  Entwurf: "offen",
  Gesendet: "gesendet",
  Angenommen: "angenommen",
  Abgelehnt: "abgelehnt",
} as const;

function baseline(): DemoWorkspaceState {
  const now = new Date().toISOString();
  const customers: Customer[] = DEMO_COMPANY_CUSTOMERS.map((customer, index) => ({
    id: customer.id,
    user_id: "demo-user",
    company_name: customer.name,
    contact_name: customer.contact,
    email: `kontakt${index + 1}@demo.invalid`,
    phone: `+49 221 555${String(1000 + index)}`,
    industry: customer.industry,
    notes: "Erfundener Beispieldatensatz für die Produktdemo.",
    anrede: null,
    vorname: null,
    nachname: customer.contact,
    strasse: "Musterstraße",
    hausnummer: String(index + 1),
    plz: String(50000 + index),
    ort: customer.city,
    festnetz: customer.hasFixedNet ? `+49 221 444${String(1000 + index)}` : null,
    handy_nr: `+49 170 555${String(1000 + index)}`,
    geburtstag: null,
    customer_status: index % 5 === 0 ? "gewonnen" : "aktiv",
    vip_kunde: index % 7 === 0,
    marketing_sms: false,
    marketing_email: index % 3 === 0,
    marketing_brief: false,
    won_at: index % 5 === 0 ? now : null,
    external_id: null,
    external_refs: null,
    mocca_customer_number: null,
    created_at: now,
    updated_at: now,
  }));

  const offers: CloudOffer[] = DEMO_COMPANY_OFFERS.map((offer, index) => {
    const customer = customers[index % customers.length];
    const config = createDefaultOptionState();
    config.mobile.quantity = Math.max(1, Number(offer.title.match(/^([0-9]+)/)?.[1] ?? 1));
    return {
      id: offer.id,
      user_id: "demo-user",
      name: offer.title,
      config,
      preview: {
        hardware: index % 3 === 0 ? "iPhone 16" : "SIM Only",
        tariff: offer.title.replace(/^\d+×\s*/, "").replace(" + Festnetz", ""),
        avgMonthly: offer.monthlyNet,
        quantity: config.mobile.quantity,
      },
      is_draft: offer.status === "Entwurf",
      created_at: `${offer.date}T10:00:00.000Z`,
      updated_at: `${offer.date}T10:00:00.000Z`,
      customer_id: customer?.id ?? null,
      team_id: null,
      visibility: "private",
      dataset_version_id: null,
      status: statusMap[offer.status],
    };
  });

  const customerMap = new Map(customers.map((customer) => [customer.company_name, customer]));
  const contracts: ContractWithCustomer[] = DEMO_COMPANY_CONTRACTS.map((contract, index) => {
    const customer = customerMap.get(contract.customer) ?? customers[index % customers.length];
    const base: CustomerContract = {
      id: contract.id,
      customer_id: customer?.id ?? "",
      user_id: "demo-user",
      netz: "vodafone",
      tarif_name: contract.product,
      handy_nr: `+49 170 700${String(1000 + index)}`,
      vertragsbeginn: contract.start,
      vertragsende: contract.end,
      vvl_datum: contract.end,
      status: "aktiv",
      hardware_name: index % 4 === 0 ? "iPhone 15" : null,
      ek_preis: index % 4 === 0 ? 520 : 0,
      monatspreis: 29 + (index % 6) * 10,
      provision_erhalten: contract.provision,
      notes: "Erfundener Demovertrag.",
      created_at: `${contract.start}T09:00:00.000Z`,
      updated_at: now,
    };
    return {
      ...base,
      customer: customer ? {
        id: customer.id,
        company_name: customer.company_name,
        contact_name: customer.contact_name,
        vorname: customer.vorname,
        nachname: customer.nachname,
      } : undefined,
    };
  });

  return { customers, offers, contracts };
}

function storageKey(userId?: string) {
  return `${PREFIX}:${userId ?? "anon"}`;
}

export function readDemoWorkspace(userId?: string): DemoWorkspaceState {
  try {
    const saved = localStorage.getItem(storageKey(userId));
    if (saved) return JSON.parse(saved) as DemoWorkspaceState;
  } catch (error) {
    console.warn("[demoWorkspace] read failed", error);
  }
  return baseline();
}

export function writeDemoWorkspace(state: DemoWorkspaceState, userId?: string) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
    window.dispatchEvent(new Event(EVENT));
  } catch (error) {
    console.warn("[demoWorkspace] write failed", error);
  }
}

export function resetDemoWorkspace(userId?: string) {
  try {
    localStorage.removeItem(storageKey(userId));
    window.dispatchEvent(new Event(EVENT));
  } catch (error) {
    console.warn("[demoWorkspace] reset failed", error);
  }
}

export function subscribeDemoWorkspace(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export function useDemoWorkspace(userId?: string) {
  const [state, setState] = useState<DemoWorkspaceState>(() => readDemoWorkspace(userId));

  useEffect(() => {
    const sync = () => setState(readDemoWorkspace(userId));
    sync();
    return subscribeDemoWorkspace(sync);
  }, [userId]);

  const update = (next: DemoWorkspaceState) => writeDemoWorkspace(next, userId);
  return { state, update };
}