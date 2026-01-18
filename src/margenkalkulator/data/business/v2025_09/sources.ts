// ============================================
// Data Sources - Phase 2 Traceability
// ============================================

export type DataSource = {
  title: string;
  url: string;
  versionDate: string;
};

export const DATA_SOURCES = {
  DSL: {
    title: "Preisliste Business Internet DSL",
    url: "https://www.vodafone.de/business/media/preisliste-business-internet-dsl.pdf",
    versionDate: "2025-06-13",
  },
  GLASFASER: {
    title: "Preisliste Business Internet Glasfaser FTTH",
    url: "https://www.vodafone.de/business/media/preisliste-business-internet-glasfaser-ftth.pdf",
    versionDate: "2025-10-25",
  },
  CABLE: {
    title: "Preisliste Red Business Internet Cable",
    url: "https://www.vodafone.de/business/media/preisliste-und-leistungsbeschreibung-kh-00745-b8-00.pdf",
    versionDate: "2025-11-26",
  },
  KOMFORT_REGIO: {
    title: "Preisliste Komfort-Anschluss Plus Regio",
    url: "https://www.vodafone.de/business/media/preisliste-komfort-anschluss-plus-regio.pdf",
    versionDate: "2025-06-13",
  },
  KOMFORT_FTTH: {
    title: "Preisliste Komfort-Anschluss Plus Glasfaser FTTH",
    url: "https://www.vodafone.de/business/media/preisliste-komfort-anschluss-plus-glasfaser-ftth.pdf",
    versionDate: "2025-10-25",
  },
  GIGAKOMBI: {
    title: "InfoDok 4511 GigaKombi Business Prime",
    url: "https://www.vodafone.de/infofaxe/4511.pdf",
    versionDate: "2025-12-01",
  },
} as const;
