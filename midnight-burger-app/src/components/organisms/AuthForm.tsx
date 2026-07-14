// src/components/organisms/AuthForm.tsx
import { Colors } from "@/src/constants/theme";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { Button } from "../atoms/Button";
import { Typography } from "../atoms/Typography";
import { CustomAlert } from "../molecules/CustomAlert";

interface AuthFormProps {
  onSuccess?: () => void;
  titleRegister?: string;
  titleLogin?: string;
}

export const AuthForm = ({
  onSuccess,
  titleRegister = "Créer un compte",
  titleLogin = "Connexion requise",
}: AuthFormProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pseudo, setPseudo] = useState("");

  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const closeAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleAuth = async () => {
    if (!email || !password) {
      return showAlert("Erreur", "Veuillez remplir tous les champs.", "error");
    }
    setLoading(true);
    try {
      if (isRegister) {
        if (!firstName || !lastName || !pseudo) {
          setLoading(false);
          return showAlert(
            "Erreur",
            "Le nom, le prénom et le pseudo sont obligatoires pour s'inscrire.",
            "error",
          );
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          pseudo: pseudo.trim(),
          email: email.trim(),
          loyaltyPoints: 0,
          totalSpent: 0,
          orderCount: 0,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showAlert("Erreur d'authentification", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.glassContainer}>
      <Typography variant="subtitle" style={styles.authTitle}>
        {isRegister ? titleRegister : titleLogin}
      </Typography>

      {isRegister && (
        <>
          <TextInput
            placeholder="Prénom"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            placeholder="Nom"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            placeholder="Pseudo"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={pseudo}
            onChangeText={setPseudo}
          />
        </>
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Mot de passe"
        placeholderTextColor={Colors.textMuted}
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={isRegister ? "S'inscrire" : "Se connecter"}
          loading={loading}
          onPress={handleAuth}
        />
      </View>
      <Button
        title={
          isRegister
            ? "Déjà un compte ? Se connecter"
            : "Pas de compte ? S'inscrire"
        }
        variant="secondary"
        onPress={() => setIsRegister(!isRegister)}
      />

      <CustomAlert
        isVisible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  authTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    color: Colors.text,
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
  buttonContainer: {
    marginTop: 6,
    marginBottom: 12,
  },
});
