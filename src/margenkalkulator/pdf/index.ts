// ============================================
// PDF Module Exports
// ============================================

export { OfferPdf } from "./OfferPdf";
export { DealerPdf } from "./DealerPdf";
export { MultiOfferPdf } from "./MultiOfferPdf";
export { ProfessionalOfferPdf } from "./ProfessionalOfferPdf";
export { PremiumOfferPdf } from "./PremiumOfferPdf";
export { styles as pdfStyles, createPdfStyles, createDealerStyles, createReportStyles } from "./styles";
export { VVLListPdf } from "./VVLListPdf";
export { CustomerReportPdf } from "./CustomerReportPdf";
export { ProvisionForecastPdf } from "./ProvisionForecastPdf";

// Premium Components
export { PremiumCoverPage } from "./components/PremiumCoverPage";
export { PremiumSummaryPage } from "./components/PremiumSummaryPage";
export { PremiumTransitionPage } from "./components/PremiumTransitionPage";
export { PremiumDetailPage } from "./components/PremiumDetailPage";
export { PremiumHardwarePage } from "./components/PremiumHardwarePage";
export { PremiumFixedNetPage } from "./components/PremiumFixedNetPage";
export { PremiumUspPage } from "./components/PremiumUspPage";
export { PremiumContactPage } from "./components/PremiumContactPage";
export { CustomPage } from "./components/CustomPage";

// Shared Components
export { PdfHeader, PdfFooter, FeatureList, PriceTablePeriod } from "./components/shared";
export type { PeriodColumn as SharedPeriodColumn, TableRow } from "./components/shared/PriceTablePeriod";

// Design System
export { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING } from "./designSystem";

// Templates
export { DEFAULT_TEMPLATE, ALLENETZE_CLEAN_TEMPLATE } from "./templates/allenetzeClean";
export { PREMIUM_O2_TEMPLATE, PREMIUM_VODAFONE_TEMPLATE } from "./templates/premiumO2Template";
export type { 
  PdfTemplate, 
  OfferCustomerInfo, 
  PdfOfferOptions,
  ProfessionalOfferPdfProps,
  PdfCompanySettings,
  PdfPageSelection,
  PeriodColumn,
  PositionRow,
} from "./templates/types";
export { DEFAULT_PAGE_SELECTION } from "./templates/types";
