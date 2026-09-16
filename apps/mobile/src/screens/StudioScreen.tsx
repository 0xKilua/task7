import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiFetch, API_URL, authHeader } from "../lib/api-client";
import {
  HairColorCatalogItem,
  SILHOUETTE_DISCLAIMER,
  SILHOUETTE_STEPS,
  SIMULATION_STATUS_LABELS,
  Simulation,
} from "../lib/shared-types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Studio">;
type Tab = "couleur" | "silhouette";

const TERMINAL_STATUSES = new Set(["completed", "failed", "provider_not_configured"]);

export function StudioScreen({ route }: Props) {
  const { photoId } = route.params;
  const [tab, setTab] = useState<Tab>("couleur");
  const [colors, setColors] = useState<HairColorCatalogItem[]>([]);
  const [colorId, setColorId] = useState<string | null>(null);
  const [deltaKg, setDeltaKg] = useState(0);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [running, setRunning] = useState(false);
  const [resultHeaders, setResultHeaders] = useState<Record<string, string>>({});
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<HairColorCatalogItem[]>("/catalog/colors").then(setColors);
    authHeader().then(setResultHeaders);
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const current = await apiFetch<Simulation>(`/simulations/${id}`);
      setSimulation(current);
      if (TERMINAL_STATUSES.has(current.status)) {
        setRunning(false);
        return;
      }
      pollTimer.current = setTimeout(() => void poll(id), 1200);
    } catch {
      setRunning(false);
    }
  }, []);

  async function generate() {
    setRunning(true);
    setSimulation(null);
    const body =
      tab === "couleur"
        ? { photoId, module: "couleur", hair: { colorId } }
        : { photoId, module: "silhouette", silhouetteDeltaKg: deltaKg };
    const created = await apiFetch<Simulation>("/simulations", { method: "POST", body });
    setSimulation(created);
    pollTimer.current = setTimeout(() => void poll(created.id), 800);
  }

  const canGenerate = tab === "couleur" ? Boolean(colorId) : deltaKg !== 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabs}>
        {(["couleur", "silhouette"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => {
              setTab(t);
              setSimulation(null);
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "couleur" ? "Couleur" : "Silhouette"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "couleur" && (
        <View style={styles.swatchGrid}>
          {colors.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setColorId(c.id)}
              style={[styles.swatch, { backgroundColor: c.swatchHex }, colorId === c.id && styles.swatchSelected]}
            />
          ))}
        </View>
      )}

      {tab === "silhouette" && (
        <View>
          <View style={styles.stepsRow}>
            {SILHOUETTE_STEPS.map((kg) => (
              <TouchableOpacity
                key={kg}
                style={[styles.step, deltaKg === kg && styles.stepActive]}
                onPress={() => setDeltaKg(kg)}
              >
                <Text style={[styles.stepText, deltaKg === kg && styles.stepTextActive]}>
                  {kg === 0 ? "0" : kg > 0 ? `+${kg}` : kg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.disclaimer}>{SILHOUETTE_DISCLAIMER}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.generateButton} onPress={generate} disabled={!canGenerate || running}>
        <Text style={styles.generateButtonText}>
          {running ? "Generation en cours..." : "Generer la simulation"}
        </Text>
      </TouchableOpacity>

      {running && <ActivityIndicator style={{ marginTop: 16 }} />}
      {simulation && (
        <Text style={styles.statusText}>
          {SIMULATION_STATUS_LABELS[simulation.status] ?? simulation.statusLabel}
        </Text>
      )}

      {simulation?.status === "completed" && (
        <Image
          source={{ uri: `${API_URL}/simulations/${simulation.id}/result`, headers: resultHeaders }}
          style={styles.resultImage}
          resizeMode="cover"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fafafa" },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "#f5f5f5" },
  tabActive: { backgroundColor: "#b32c64" },
  tabText: { color: "#404040", fontWeight: "600" },
  tabTextActive: { color: "white" },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#00000022" },
  swatchSelected: { borderWidth: 3, borderColor: "#b32c64" },
  stepsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  step: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#f5f5f5" },
  stepActive: { backgroundColor: "#b32c64" },
  stepText: { color: "#404040", fontWeight: "600" },
  stepTextActive: { color: "white" },
  disclaimer: {
    marginTop: 12,
    fontSize: 12,
    color: "#92400e",
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 10,
  },
  generateButton: {
    marginTop: 20,
    backgroundColor: "#b32c64",
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
  },
  generateButtonText: { color: "white", fontWeight: "600" },
  statusText: { marginTop: 12, textAlign: "center", color: "#525252" },
  resultImage: { marginTop: 16, width: "100%", aspectRatio: 3 / 4, borderRadius: 16 },
});
