// src/components/organisms/EditProfileModal.tsx
import { AVAILABLE_CITIES } from "@/src/constants/cities";
import { Colors } from "@/src/constants/theme";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { db } from "../../../firebaseConfig";
import { Button } from "../atoms/Button";
import { Typography } from "../atoms/Typography";
import { BaseBottomSheet } from "../molecules/BaseBottomSheet";
import { CustomAlert } from "../molecules/CustomAlert";

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  userUid: string;
  userData: any;
}

export const EditProfileModal = ({
  isVisible,
  onClose,
  userUid,
  userData,
}: EditProfileModalProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [phone, setPhone] = useState("");

  const [formattedAddress, setFormattedAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const googlePlacesRef = useRef<any>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    onCloseAction?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (userData && isVisible) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setPseudo(userData.pseudo || "");
      setPhone(userData.phone || "");

      if (userData.savedAddress) {
        setFormattedAddress(userData.savedAddress.street || "");
        setCity(userData.savedAddress.city || "");
        setLat(userData.savedAddress.lat || null);
        setLng(userData.savedAddress.lng || null);
        setDetails(userData.savedAddress.details || "");

        setTimeout(() => {
          googlePlacesRef.current?.setAddressText(
            userData.savedAddress.street || "",
          );
        }, 500);
      }
    }
  }, [userData, isVisible]);

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning",
    onCloseAction?: () => void,
  ) => {
    setAlertConfig({ visible: true, title, message, type, onCloseAction });
  };

  const handleCloseAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (alertConfig.onCloseAction) {
      alertConfig.onCloseAction();
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !pseudo.trim()) {
      return showAlert(
        "Erreur",
        "Le nom, le prénom et le pseudo sont obligatoires.",
        "error",
      );
    }
    if (!phone.trim()) {
      return showAlert(
        "Erreur",
        "Le numéro de téléphone est obligatoire.",
        "error",
      );
    }

    const hasStartedTypingAddress =
      formattedAddress.trim().length > 0 || city.length > 0;

    if (hasStartedTypingAddress) {
      if (!formattedAddress.trim() || !lat || !lng) {
        return showAlert(
          "Erreur",
          "Veuillez sélectionner une adresse valide dans la liste proposée par Google.",
          "error",
        );
      }

      // 🟢 SUPPRESSION : On ne bloque plus la sauvegarde si la ville n'est pas dans la liste.
    }

    setLoading(true);
    try {
      const addressObj = hasStartedTypingAddress
        ? {
            street: formattedAddress,
            city,
            details,
            lat,
            lng,
          }
        : null;

      const userUpdates: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pseudo: pseudo.trim(),
        phone: phone.trim(),
      };

      if (addressObj) {
        userUpdates.savedAddress = addressObj;
      }

      await updateDoc(doc(db, "users", userUid), userUpdates);

      showAlert(
        "Succès",
        "Vos informations ont été mises à jour !",
        "success",
        () => {
          onClose();
        },
      );
    } catch (error: any) {
      showAlert(
        "Erreur",
        "Impossible de sauvegarder : " + error.message,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseBottomSheet
      isVisible={isVisible}
      title="Mes informations"
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="body" style={styles.sectionSubtitle}>
          MON PROFIL
        </Typography>
        <View style={styles.glassCard}>
          <TextInput
            placeholder="Prénom *"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            placeholder="Nom *"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            placeholder="Pseudo *"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={pseudo}
            onChangeText={setPseudo}
          />
        </View>

        <Typography variant="body" style={styles.sectionSubtitle}>
          CONTACT
        </Typography>
        <View style={styles.glassCard}>
          <TextInput
            placeholder="Numéro de téléphone *"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            style={[styles.input, { marginBottom: 0 }]}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Typography variant="body" style={styles.sectionSubtitle}>
          ADRESSE PAR DÉFAUT
        </Typography>
        <View style={styles.glassCard}>
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder="Saisissez votre adresse"
            fetchDetails={true}
            debounce={300}
            onPress={(data, details = null) => {
              if (details) {
                const addressComponents = details.address_components;
                const cityObj = addressComponents.find(
                  (c) =>
                    c.types.includes("locality") ||
                    c.types.includes("administrative_area_level_3"),
                );
                const extractedCity = cityObj ? cityObj.long_name : "";

                // 🟢 AJOUT : Vérification au moment de la sélection
                const isCityAllowed = AVAILABLE_CITIES.filter(
                  (c) => c !== "Autres" && c !== "autre" && c !== "Autres ",
                ).some(
                  (c) =>
                    c.toLowerCase().trim() ===
                    extractedCity.toLowerCase().trim(),
                );

                if (!isCityAllowed) {
                  showAlert(
                    "Hors zone habituelle",
                    `Attention, ${extractedCity || "cette ville"} ne fait pas partie de nos zones de livraison habituelles.\n\nVous pouvez enregistrer cette adresse, mais le restaurant se réserve le droit d'annuler la commande.`,
                    "warning",
                  );
                }

                // 🟢 On sauvegarde quand même l'adresse dans le state
                setFormattedAddress(data.description);
                setCity(extractedCity);
                setLat(details.geometry.location.lat);
                setLng(details.geometry.location.lng);
              }
            }}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
              language: "fr",
              components: "country:fr",
              location: "44.7937,-1.1492",
              radius: "25000",
            }}
            textInputProps={{
              placeholderTextColor: Colors.textMuted,
              onFocus: () => {
                if (lat || lng) {
                  setLat(null);
                  setLng(null);
                  setCity("");
                }
              },
            }}
            styles={{
              container: { flex: 0, marginBottom: 14 },
              textInput: styles.inputGoogle,
              row: styles.rowGoogle,
              description: styles.descriptionGoogle,
              separator: styles.separatorGoogle,
              listView: styles.listViewGoogle,
            }}
          />

          <TextInput
            placeholder="Bâtiment, étage, code porte... (optionnel)"
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.detailsInput]}
            value={details}
            onChangeText={setDetails}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.stickyFooter}>
        <Button
          title="Sauvegarder"
          loading={loading}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>

      <CustomAlert
        isVisible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={handleCloseAlert}
      />
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 8,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  glassCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 24,
    zIndex: 100,
  },
  detailsInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 0,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 24 : 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  inputGoogle: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  rowGoogle: {
    backgroundColor: Colors.backgroundLight,
    padding: 14,
    minHeight: 44,
    flexDirection: "row",
  },
  descriptionGoogle: {
    color: Colors.text,
    fontSize: 14,
  },
  separatorGoogle: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  listViewGoogle: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
    marginTop: 4,
    position: "relative",
    zIndex: 999,
    elevation: 5,
  },
});
