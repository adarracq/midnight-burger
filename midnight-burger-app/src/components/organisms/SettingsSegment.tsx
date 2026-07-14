// src/components/organisms/SettingsSegment.tsx
import { Colors } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "../atoms/Typography";

interface SettingsSegmentProps {
  user: any;
  userData: any;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onEditAddress: () => void;
}

export const SettingsSegment = ({
  user,
  userData,
  onLogout,
  onDeleteAccount,
  onEditAddress,
}: SettingsSegmentProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Typography variant="title" style={styles.userAvatarText}>
            {userData?.firstName
              ? userData.firstName.charAt(0).toUpperCase()
              : ""}
          </Typography>
        </View>
        <View style={styles.userInfo}>
          <Typography variant="subtitle" style={styles.userName}>
            {userData?.firstName || ""}
          </Typography>
          <Typography variant="body" style={styles.userEmail}>
            {user.email}
          </Typography>
        </View>
      </View>

      <Typography variant="body" style={styles.sectionSubtitle}>
        GÉNÉRAL
      </Typography>
      <View style={styles.settingsGroup}>
        <TouchableOpacity style={styles.settingsRow} onPress={onEditAddress}>
          <View style={styles.settingsRowLeft}>
            <Ionicons
              name="person-outline"
              size={20}
              color={Colors.text}
              style={styles.settingsIcon}
            />
            <Typography variant="body" style={styles.settingsText}>
              Profil & Adresse
            </Typography>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingsRow} onPress={onLogout}>
          <View style={styles.settingsRowLeft}>
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.error}
              style={styles.settingsIcon}
            />
            <Typography
              variant="body"
              style={[styles.settingsText, { color: Colors.error }]}
            >
              Se déconnecter
            </Typography>
          </View>
        </TouchableOpacity>
      </View>

      {/* NOUVEAU BLOC DE CONTACT */}
      <Typography variant="body" style={styles.sectionSubtitle}>
        ASSISTANCE
      </Typography>
      <View style={styles.settingsGroup}>
        <TouchableOpacity
          style={styles.settingsRow}
          onPress={() => Linking.openURL("tel:0661651136")}
        >
          <View style={styles.settingsRowLeft}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.text}
              style={styles.settingsIcon}
            />
            <Typography variant="body" style={styles.settingsText}>
              Cap Ferret
            </Typography>
          </View>
          <Typography variant="body" style={styles.phoneText}>
            06 61 65 11 36
          </Typography>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.settingsRow}
          onPress={() => Linking.openURL("tel:0667633391")}
        >
          <View style={styles.settingsRowLeft}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.text}
              style={styles.settingsIcon}
            />
            <Typography variant="body" style={styles.settingsText}>
              Andernos - Arès
            </Typography>
          </View>
          <Typography variant="body" style={styles.phoneText}>
            06 67 63 33 91
          </Typography>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.settingsRow}
          onPress={() => Linking.openURL("tel:0667625930")}
        >
          <View style={styles.settingsRowLeft}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.text}
              style={styles.settingsIcon}
            />
            <Typography variant="body" style={styles.settingsText}>
              Lacanau
            </Typography>
          </View>
          <Typography variant="body" style={styles.phoneText}>
            06 67 62 59 30
          </Typography>
        </TouchableOpacity>
      </View>

      <Typography variant="body" style={styles.sectionSubtitle}>
        ZONE DANGEREUSE
      </Typography>
      <View style={styles.settingsGroup}>
        <TouchableOpacity style={styles.settingsRow} onPress={onDeleteAccount}>
          <View style={styles.settingsRowLeft}>
            <Ionicons
              name="trash-outline"
              size={20}
              color={Colors.error}
              style={styles.settingsIcon}
            />
            <Typography
              variant="body"
              style={[styles.settingsText, { color: Colors.error }]}
            >
              Supprimer mon compte
            </Typography>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 10 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  userAvatarText: { marginBottom: 0, fontSize: 24, color: Colors.text },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, marginBottom: 2 },
  userEmail: { color: Colors.textMuted, marginBottom: 0 },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 8,
  },
  settingsGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 24,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center" },
  settingsIcon: { marginRight: 12 },
  settingsText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 0,
    color: Colors.text,
  },
  phoneText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 0,
    color: Colors.primary,
  },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 52 },
});
