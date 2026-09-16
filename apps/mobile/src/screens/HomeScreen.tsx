import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiFetch, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Acces a la photothèque refuse.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", {
        uri: asset.uri,
        name: asset.fileName ?? "photo.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);

      const uploadResult = await apiFetch<{ photoId: string }>("/photos", {
        method: "POST",
        body: form,
        isFormData: true,
      });
      navigation.navigate("Studio", { photoId: uploadResult.photoId });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Essayez une nouvelle coiffure, couleur, tenue ou silhouette</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickAndUpload} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.uploadText}>Choisir une photo dans votre photothèque</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Gallery")}>
        <Text style={styles.secondaryButtonText}>Ma galerie</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => void logout()}>
        <Text style={styles.link}>Deconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fafafa", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 24 },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#d4d4d4",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    backgroundColor: "white",
  },
  uploadText: { color: "#525252", textAlign: "center" },
  secondaryButton: {
    marginTop: 16,
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  secondaryButtonText: { color: "#404040", fontWeight: "600" },
  link: { marginTop: 16, textAlign: "center", color: "#932051" },
  error: { color: "#dc2626", marginTop: 12, textAlign: "center" },
});
