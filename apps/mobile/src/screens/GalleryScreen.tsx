import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { apiFetch, API_URL, authHeader } from "../lib/api-client";
import type { Simulation } from "../lib/shared-types";

export function GalleryScreen() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authHeader().then(setHeaders);
    apiFetch<Simulation[]>("/simulations")
      .then(setSimulations)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <FlatList
      data={simulations}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      ListEmptyComponent={<Text style={styles.empty}>Aucune simulation pour le moment.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.status === "completed" ? (
            <Image
              source={{ uri: `${API_URL}/simulations/${item.id}/result`, headers }}
              style={styles.thumb}
            />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbPlaceholderText}>{item.statusLabel}</Text>
            </View>
          )}
          <Text style={styles.module}>{item.module}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: { gap: 12 },
  card: { flex: 1, marginBottom: 12 },
  thumb: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: "#f5f5f5" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center", padding: 8 },
  thumbPlaceholderText: { fontSize: 11, color: "#737373", textAlign: "center" },
  module: { marginTop: 4, fontSize: 12, color: "#404040", textTransform: "capitalize" },
  empty: { textAlign: "center", color: "#737373", marginTop: 40 },
});
