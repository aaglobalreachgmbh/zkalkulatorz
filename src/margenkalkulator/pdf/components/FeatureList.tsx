// ============================================
// FeatureList - Checkmark-Liste für Tarif-Features
// ============================================

import { View, Text, StyleSheet } from "@react-pdf/renderer";

interface FeatureListProps {
    items: string[];
    checkColor?: string;
}

const styles = StyleSheet.create({
    list: {
        marginVertical: 10,
    },
    item: {
        flexDirection: "row",
        marginBottom: 4,
        alignItems: "flex-start",
    },
    checkmark: {
        width: 16,
        fontSize: 10,
        marginRight: 6,
    },
    text: {
        flex: 1,
        fontSize: 9,
        color: "#374151",
        lineHeight: 1.4,
    },
});

export function FeatureList({
    items,
    checkColor = "#22c55e"  // Grün als Default
}: FeatureListProps) {
    return (
        <View style={styles.list}>
            {items.map((item, idx) => (
                <View key={idx} style={styles.item}>
                    <Text style={[styles.checkmark, { color: checkColor }]}>✓</Text>
                    <Text style={styles.text}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

export default FeatureList;
