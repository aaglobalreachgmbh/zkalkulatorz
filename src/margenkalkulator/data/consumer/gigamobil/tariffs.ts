import { MobileTariff, SubVariantId } from "../../../engine/types";

// Base prices are stored as NETTO.
// Standard List Prices (Brutto) 2025:
// XS: 29.99 -> ~25.20
// S:  39.99 -> ~33.61
// M:  49.99 -> ~42.01
// L:  59.99 -> ~50.41
// XL: 79.99 -> ~67.22

const SUB_VARIANTS: SubVariantId[] = ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE", "PREMIUM_SMARTPHONE", "SPECIAL_PREMIUM_SMARTPHONE"];

export const gigaMobilTariffs: MobileTariff[] = [
    {
        id: "GIGAMOBIL_XS",
        name: "Vodafone GigaMobil XS",
        tier: "XS",
        productLine: "GIGAMOBIL",
        family: "gigamobil",
        baseNet: 25.202, // 29.99 Gross
        dataVolumeGB: 7,
        minTermMonths: 24,
        features: [
            "7 GB Datenvolumen (4G|5G)",
            "Max 500 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive",
            "Voll GigaKombi-Berechtigt"
        ],
        provisionBase: 350, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    },
    {
        id: "GIGAMOBIL_S",
        name: "Vodafone GigaMobil S",
        tier: "S",
        productLine: "GIGAMOBIL",
        family: "gigamobil",
        baseNet: 33.605, // 39.99 Gross
        dataVolumeGB: 25,
        minTermMonths: 24,
        features: [
            "25 GB Datenvolumen (4G|5G)",
            "Max 500 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive",
            "Voll GigaKombi-Berechtigt"
        ],
        provisionBase: 450, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    },
    {
        id: "GIGAMOBIL_M",
        name: "Vodafone GigaMobil M",
        tier: "M",
        productLine: "GIGAMOBIL",
        family: "gigamobil",
        baseNet: 42.008, // 49.99 Gross
        dataVolumeGB: 50,
        minTermMonths: 24,
        features: [
            "50 GB Datenvolumen (4G|5G)",
            "Max 500 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive",
            "Voll GigaKombi-Berechtigt (Unlimited möglich)"
        ],
        provisionBase: 500, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    },
    {
        id: "GIGAMOBIL_L",
        name: "Vodafone GigaMobil L",
        tier: "L",
        productLine: "GIGAMOBIL",
        family: "gigamobil",
        baseNet: 50.412, // 59.99 Gross
        dataVolumeGB: 280,
        minTermMonths: 24,
        features: [
            "280 GB Datenvolumen (4G|5G)",
            "Max 500 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive",
            "Voll GigaKombi-Berechtigt (Unlimited möglich)"
        ],
        provisionBase: 600, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    },
    {
        id: "GIGAMOBIL_XL",
        name: "Vodafone GigaMobil XL",
        tier: "XL",
        productLine: "GIGAMOBIL",
        family: "gigamobil",
        baseNet: 67.218, // 79.99 Gross
        dataVolumeGB: "unlimited",
        minTermMonths: 24,
        features: [
            "Unbegrenztes Datenvolumen (4G|5G)",
            "Max 500 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive",
            "Voll GigaKombi-Berechtigt"
        ],
        provisionBase: 700, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    }
];
