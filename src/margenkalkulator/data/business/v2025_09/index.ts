// ============================================
// Business Dataset v2025-09 - Index
// ============================================

import type { Catalog } from "../../../../margenkalkulator/engine/types";
import { mobilePrimeTariffs } from "./mobilePrime";
import { businessSmartTariffs } from "./businessSmart";
import { smartBusinessTariffs } from "./smartBusiness";
import { teamDealTariffs } from "./teamDeal";
import { businessPromos } from "./promos";
import { businessSubVariants } from "./subVariants";
import { fixedNetCableProducts } from "./fixedNetCable";
import { fixedNetDSLProducts } from "./fixedNetDSL";
import { fixedNetFiberProducts } from "./fixedNetFiber";
import { fixedNetKomfortProducts } from "./fixedNetKomfort";
import { hardwareCatalog } from "./hardware";

export const businessCatalog2025_09: Catalog = {
  version: "business-2025-09",
  validFrom: "2025-09-01",
  subVariants: businessSubVariants,
  mobileTariffs: [
    ...mobilePrimeTariffs,
    ...businessSmartTariffs,
    ...smartBusinessTariffs,
    ...teamDealTariffs,
  ],
  promos: businessPromos,
  fixedNetProducts: [
    ...fixedNetCableProducts,
    ...fixedNetDSLProducts,
    ...fixedNetFiberProducts,
    ...fixedNetKomfortProducts,
  ],
  hardwareCatalog,
};

// Re-export individual modules
export { mobilePrimeTariffs } from "./mobilePrime";
export { businessSmartTariffs } from "./businessSmart";
export { smartBusinessTariffs } from "./smartBusiness";
export { teamDealTariffs, TEAMDEAL_FALLBACK } from "./teamDeal";
export { businessPromos } from "./promos";
export { businessSubVariants } from "./subVariants";
export { fixedNetCableProducts } from "./fixedNetCable";
export { fixedNetDSLProducts } from "./fixedNetDSL";
export { fixedNetFiberProducts } from "./fixedNetFiber";
export { fixedNetKomfortProducts } from "./fixedNetKomfort";
export { hardwareCatalog } from "./hardware";
export { 
  komfortRegioPhoneTiers, 
  komfortRegioInternetOptions,
  komfortFTTHPhoneTiers,
  komfortFTTHInternetOptions,
  getKomfortPhoneTier,
  getKomfortInternetOption,
  calculateKomfortMonthly,
  KOMFORT_FIXED_IP_ADDON_NET,
} from "./fixedNetKomfort";
export { DATA_SOURCES } from "./sources";
