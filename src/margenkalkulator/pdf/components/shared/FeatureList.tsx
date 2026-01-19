// ============================================
// Shared Feature List Component
// Checkmark list for tariff features
// Publisher: allenetze.de
// ============================================

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS, PDF_TYPOGRAPHY } from "../../designSystem";

interface FeatureListProps {
  title?: string;
  items: string[];
  checkColor?: string;
  columns?: 1 | 2;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 6,
  },
  list: {
    flexDirection: "column",
  },
  listTwoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemTwoCol: {
    width: "50%",
  },
  check: {
    width: 14,
    fontSize: PDF_TYPOGRAPHY.body,
    fontWeight: "bold",
  },
  text: {
    flex: 1,
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.text,
    lineHeight: 1.3,
  },
});

export function FeatureList({
  title,
  items,
  checkColor = PDF_COLORS.success,
  columns = 1,
}: FeatureListProps) {
  const isTwoCol = columns === 2;
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={isTwoCol ? styles.listTwoCol : styles.list}>
        {items.map((item, idx) => (
          <View
            key={idx}
            style={[styles.item, isTwoCol ? styles.itemTwoCol : {}]}
          >
            <Text style={[styles.check, { color: checkColor }]}>✓</Text>
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
