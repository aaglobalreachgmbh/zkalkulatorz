import { MobileTariff, SubVariantId } from "../../../engine/types";

// Base prices are stored as NETTO.
// Marketing prices (Brutto):
// Smart S: 39.99 -> ~33.61
// Smart M: 44.99 -> ~37.81
// Smart L: 49.99 -> ~42.01
// Smart XL: 54.99 -> ~46.21

const SUB_VARIANTS: SubVariantId[] = ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE", "PREMIUM_SMARTPHONE"];

export const smartTariffs: MobileTariff[] = [
    {
        id: "SMART_S",
        name: "Vodafone Smart S",
        tier: "S",
        productLine: "CONSUMER_SMART",
        family: "consumer_smart",
        baseNet: 33.605, // 39.99 Gross
        dataVolumeGB: 65,
        minTermMonths: 24,
        features: [
            "65 GB Datenvolumen (4G|5G)",
            "Max 300 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive"
        ],
        provisionBase: 400, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605, // 39.99 Gross Anschlussgebühr
    },
    {
        id: "SMART_M",
        name: "Vodafone Smart M",
        tier: "M",
        productLine: "CONSUMER_SMART",
        family: "consumer_smart",
        baseNet: 37.807, // 44.99 Gross
        dataVolumeGB: 85,
        minTermMonths: 24,
        features: [
            "85 GB Datenvolumen (4G|5G)",
            "Max 300 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive"
        ],
        provisionBase: 450, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    },
    {
        id: "SMART_L",
        name: "Vodafone Smart L",
        tier: "L",
        productLine: "CONSUMER_SMART",
        family: "consumer_smart",
        baseNet: 42.008, // 49.99 Gross
        dataVolumeGB: 105,
        minTermMonths: 24,
        features: [
            "105 GB Datenvolumen (4G|5G)",
            "Max 300 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive"
        ],
        provisionBase: 500, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    },
    {
        id: "SMART_XL",
        name: "Vodafone Smart XL",
        tier: "XL",
        productLine: "CONSUMER_SMART",
        family: "consumer_smart",
        baseNet: 46.210, // 54.99 Gross
        dataVolumeGB: 125,
        minTermMonths: 24,
        features: [
            "125 GB Datenvolumen (4G|5G)",
            "Max 300 Mbit/s",
            "Allnet Flat (Tel & SMS)",
            "EU-Roaming inklusive",
            "GigaDepot inklusive"
        ],
        provisionBase: 550, // ESTIMATE
        deductionRate: 0,
        allowedSubVariants: SUB_VARIANTS,
        setupFeeNet: 33.605,
    }
];
