// ============================================
// PDF Styles - Vodafone Business Angebot
// ============================================

import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#e4002b",
    paddingBottom: 20,
  },
  
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e4002b",
  },
  
  logoSubtext: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  
  headerRight: {
    textAlign: "right",
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  
  headerDate: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4,
  },
  
  // Info Section
  infoSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  
  infoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  
  infoLabel: {
    width: 100,
    fontSize: 9,
    color: "#666666",
  },
  
  infoValue: {
    fontSize: 9,
    color: "#1a1a1a",
    fontWeight: "bold",
  },
  
  // Table
  table: {
    marginBottom: 25,
  },
  
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
  },
  
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  
  tableCell: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  
  tableCellRight: {
    textAlign: "right",
  },
  
  colPosition: { width: "50%" },
  colMonthly: { width: "25%", textAlign: "right" },
  colOneTime: { width: "25%", textAlign: "right" },
  
  // Summary
  summarySection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
  },
  
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  
  summaryLabel: {
    fontSize: 10,
    color: "#cccccc",
  },
  
  summaryValue: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
  },
  
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#444444",
  },
  
  summaryTotalLabel: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
  },
  
  summaryTotalValue: {
    fontSize: 22,
    color: "#e4002b",
    fontWeight: "bold",
  },
  
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  
  footerLeft: {
    fontSize: 8,
    color: "#999999",
  },
  
  footerRight: {
    fontSize: 8,
    color: "#999999",
    textAlign: "right",
  },
  
  // Legal Text
  legalSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  
  legalText: {
    fontSize: 7,
    color: "#999999",
    lineHeight: 1.4,
  },
});
