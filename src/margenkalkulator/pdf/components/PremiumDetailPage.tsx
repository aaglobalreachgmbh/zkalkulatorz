// ============================================
// Premium Detail Page - O2 Business Style
// Mobile tariff features with checkmarks, period tables
// Publisher: allenetze.de
// ============================================

import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps, PeriodColumn, PositionRow } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING, formatCurrencyPdf, formatDiscountPdf, sanitizeTextPdf } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";
import { PdfHeader } from "./shared/PdfHeader";
import { PdfFooter } from "./shared/PdfFooter";
import { FeatureList } from "./shared/FeatureList";
import { PriceTablePeriod } from "./shared/PriceTablePeriod";

interface PremiumDetailPageProps {
  template: ProfessionalOfferPdfProps["template"];
  items: ProfessionalOfferPdfProps["items"];
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}

const styles = StyleSheet.create({
  page: {
    padding: PDF_SPACING.pagePadding,
    fontFamily: "Helvetica",
    fontSize: PDF_TYPOGRAPHY.body,
    backgroundColor: "#ffffff",
    paddingBottom: 60,
  },
  
  // Section title
  sectionTitle: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 8,
    marginTop: 10,
  },
  
  sectionSubtitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    marginTop: -4,
    marginBottom: 15,
  },
  
  // Detail card (O2 style)
  detailCard: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 18,
    overflow: "hidden",
  },
  
  detailCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: PDF_COLORS.primary + "10",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  
  detailCardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  
  detailCardSubtitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    marginTop: 2,
  },
  
  detailCardPrice: {
    textAlign: "right",
  },
  
  priceLabel: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.textLight,
  },
  
  priceValue: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.primary,
  },
  
  detailCardBody: {
    padding: 12,
  },
  
  // Promo badge
  promoBadge: {
    backgroundColor: PDF_COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  
  promoBadgeText: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: "#ffffff",
    fontWeight: "bold",
  },
  
  // Tariff table
  tariffTableContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 12,
  },
  
  tariffTableTitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 8,
  },
  
  // Publisher badge
  publisherBadge: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    alignItems: "center",
  },
  
  publisherText: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.textLight,
  },
});

// Default mobile features by tariff tier
const TARIFF_FEATURES = {
  prime: [
    "Unbegrenztes Datenvolumen mit 5G",
    "Allnet-Flat: Telefonie & SMS in alle dt. Netze",
    "EU-Roaming inklusive",
    "MultiSIM Option verfügbar",
    "Business Hotline mit Vorrang",
    "Kostenlose Mailbox Pro",
  ],
  smart: [
    "Großes Datenvolumen mit 5G",
    "Allnet-Flat: Telefonie & SMS",
    "EU-Roaming inklusive",
    "MultiSIM Option buchbar",
    "Kostenlose Mailbox",
  ],
  default: [
    "Mobiles Internet mit LTE/5G",
    "Telefonie & SMS Flat",
    "EU-Roaming inklusive",
    "Flexible Optionen buchbar",
  ],
};

function getTariffFeatures(tariffName: string): string[] {
  const nameLower = tariffName.toLowerCase();
  if (nameLower.includes("prime") || nameLower.includes("unlimited")) {
    return TARIFF_FEATURES.prime;
  }
  if (nameLower.includes("smart") || nameLower.includes("basic")) {
    return TARIFF_FEATURES.smart;
  }
  return TARIFF_FEATURES.default;
}

export function PremiumDetailPage({
  template,
  items,
  branding,
  pageNumber,
  totalPages,
}: PremiumDetailPageProps) {
  const displayName = branding?.companyName || template.publisherInfo.name;
  
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  
  return (
    <Page size="A4" style={styles.page}>
      <PdfHeader
        branding={branding}
        publisherSubline={PUBLISHER.subline}
        primaryColor={primaryColor}
        title="Mobilfunk-Details"
      />
      
      {/* Section Title */}
      <Text style={styles.sectionTitle}>Ihre Mobilfunkverträge</Text>
      <Text style={styles.sectionSubtitle}>
        Mindestvertragslaufzeit: 24 Monate | Alle Preise zzgl. MwSt.
      </Text>
      
      {/* Tariff Cards */}
      {items.map((item, idx) => {
        const { option, result } = item;
        const tariffBase = result.breakdown.find(b => b.ruleId === "base");
        const tariffName = tariffBase?.label?.replace(" Grundpreis", "") || "Mobilfunk-Tarif";
        const contractType = option.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung";
        const features = getTariffFeatures(tariffName);
        const hasDiscounts = result.breakdown.some(b => b.net < 0);
        
        // Build period table data for this tariff
        const hasPeriods = result.periods.length > 1;
        const periods: PeriodColumn[] = hasPeriods 
          ? result.periods.map(p => ({
              header: p.fromMonth === p.toMonth 
                ? `Monat ${p.fromMonth}`
                : `${p.fromMonth}.-${p.toMonth}. Monat`,
              fromMonth: p.fromMonth,
              toMonth: p.toMonth,
            }))
          : [{ header: "Monatlich", fromMonth: 1, toMonth: 24 }];
        
        // Build rows for this tariff
        const rows: PositionRow[] = [];
        
        // Base price
        rows.push({
          quantity: option.mobile.quantity,
          label: tariffName,
          monthlyByPeriod: hasPeriods 
            ? result.periods.map(p => p.monthly.net)
            : [result.totals.avgTermNet],
        });
        
        // Discounts
        const discounts = result.breakdown.filter(b => 
          b.appliesTo === "monthly" && b.net < 0 && !b.ruleId?.includes("fixed")
        );
        
        for (const discount of discounts) {
          rows.push({
            label: discount.label || "Rabatt",
            monthlyByPeriod: hasPeriods 
              ? result.periods.map(() => discount.net)
              : [discount.net],
            isDiscount: true,
          });
        }
        
        // Subtotal
        rows.push({
          label: "Zwischensumme",
          monthlyByPeriod: hasPeriods
            ? result.periods.map(p => p.monthly.net)
            : [result.totals.avgTermNet],
          isSubtotal: true,
        });
        
        return (
          <View key={idx} style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View>
                <Text style={styles.detailCardTitle}>{tariffName}</Text>
                <Text style={styles.detailCardSubtitle}>
                  {option.mobile.quantity}x {contractType}
                </Text>
              </View>
              <View style={styles.detailCardPrice}>
                <Text style={styles.priceValue}>
                  {formatCurrencyPdf(result.totals.avgTermNet)}
                </Text>
                <Text style={styles.priceLabel}>pro Monat / Vertrag</Text>
              </View>
            </View>
            
            <View style={styles.detailCardBody}>
              {/* Features */}
              <FeatureList
                title="Im Tarif inklusive:"
                items={features}
                checkColor={PDF_COLORS.success}
                columns={2}
              />
              
              {/* Promo badge if discounts */}
              {hasDiscounts && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>
                    ✓ Aktionsrabatt inkl.
                  </Text>
                </View>
              )}
              
              {/* Period table for this tariff */}
              {hasPeriods && (
                <View style={styles.tariffTableContainer}>
                  <Text style={styles.tariffTableTitle}>Preisübersicht nach Zeitraum</Text>
                  <PriceTablePeriod
                    periods={periods}
                    rows={rows}
                    showOneTimeColumn={false}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                  />
                </View>
              )}
            </View>
          </View>
        );
      })}
      
      {/* Publisher badge */}
      <View style={styles.publisherBadge}>
        <Text style={styles.publisherText}>
          Erstellt mit {PUBLISHER.name} | {PUBLISHER.links.impressum}
        </Text>
      </View>
      
      <PdfFooter
        publisherSubline={PUBLISHER.subline}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </Page>
  );
}
