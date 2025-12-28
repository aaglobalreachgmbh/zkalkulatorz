// ============================================
// Business Dataset v2025-10 (Oktober 2025)
// ============================================
// Quellen:
//   - SoHo_Provisionsliste_Mobilfunk_TK-World.pdf
//   - Preisliste2025FachhandelKW52_2025-12-23.pdf (einsamobile)
//   - InfoDok 4246, 4262 (Vodafone)
// ============================================
// SICHERHEITSHINWEIS: Dieser Datensatz enthält vertrauliche
// Händlerdaten (EK-Preise, Provisionen) und ist nur über
// authentifizierte Routen zugänglich.
// ============================================

// Tarife
export { mobilePrimeTariffs } from "./mobilePrime";
export { businessSmartTariffs } from "./businessSmart";

// Hardware
export { hardwareCatalog } from "./hardware";

// Provisions-System
export { 
  provisionTable, 
  getProvision, 
  getProvisionDetails,
  type ProvisionEntry 
} from "./provisions";

// OMO-Matrix
export { 
  omoMatrix, 
  getOMODeduction, 
  getAvailableOMORates, 
  hasOMO,
  AVAILABLE_OMO_RATES,
  type OMOMatrixEntry,
  type OMORate
} from "./omoMatrix";

// Re-export aus v2025_09 für nicht-aktualisierte Daten
export { fixedNetCableProducts } from "../v2025_09/fixedNetCable";
export { fixedNetDSLProducts } from "../v2025_09/fixedNetDSL";
export { fixedNetFiberProducts } from "../v2025_09/fixedNetFiber";
export { fixedNetKomfortProducts } from "../v2025_09/fixedNetKomfort";
export { businessPromos } from "../v2025_09/promos";
export { businessSubVariants } from "../v2025_09/subVariants";
export { teamDealTariffs } from "../v2025_09/teamDeal";

// Dataset-Metadaten
export const datasetMeta = {
  version: "v2025_10",
  validFrom: "2025-10-01",
  validUntil: "2025-10-31",
  verifiedAt: "2025-10-01",
  sources: [
    {
      name: "TK-World SoHo Provisionsliste",
      type: "pdf",
      date: "2025-10",
    },
    {
      name: "einsamobile Fachhandel Preisliste KW52",
      type: "pdf", 
      date: "2025-12-23",
    },
    {
      name: "Vodafone InfoDok 4246",
      type: "url",
      url: "https://www.vodafone.de/infofaxe/4246.pdf",
    },
    {
      name: "Vodafone InfoDok 4262",
      type: "url",
      url: "https://www.vodafone.de/infofaxe/4262.pdf",
    },
  ],
};

// Kombinierte Tarif-Liste für einfachen Zugriff
import { mobilePrimeTariffs } from "./mobilePrime";
import { businessSmartTariffs } from "./businessSmart";

export const allMobileTariffs = [
  ...mobilePrimeTariffs,
  ...businessSmartTariffs,
];
