// src/components/organisms/OrderModal.tsx
import { Colors } from "@/src/constants/theme";
import { Order } from "@/src/models/Order";
import { Ionicons } from "@expo/vector-icons";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../../firebaseConfig";
import { Typography } from "../atoms/Typography";
import { BaseBottomSheet } from "../molecules/BaseBottomSheet";

interface OrderModalProps {
  isVisible: boolean;
  order: Order | null;
  onClose: () => void;
}

export const OrderModal = ({ isVisible, order, onClose }: OrderModalProps) => {
  const bar1Anim = useRef(new Animated.Value(0)).current;
  const bar2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!order) return;
    bar1Anim.stopAnimation();
    bar2Anim.stopAnimation();

    const createPulsingAnimation = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );
    };

    if (order.status === "pending") {
      bar2Anim.setValue(0);
      createPulsingAnimation(bar1Anim).start();
    } else if (order.status === "delivering") {
      bar1Anim.setValue(1);
      createPulsingAnimation(bar2Anim).start();
    } else if (order.status === "completed") {
      bar1Anim.setValue(1);
      bar2Anim.setValue(1);
    } else {
      bar1Anim.setValue(0);
      bar2Anim.setValue(0);
    }
  }, [order?.status]);

  if (!order) return null;

  const formatFullDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const isCancelled = order.status === "cancelled";

  const handleCancelOrder = () => {
    Alert.alert(
      "Annuler la commande",
      "Es-tu sûr de vouloir annuler cette commande ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "orders", order.id), {
                status: "cancelled",
                canceledAt: serverTimestamp(),
                cancellationReason: "Annulée par le client",
              });
              onClose();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
    );
  };

  return (
    <BaseBottomSheet
      isVisible={isVisible}
      title="Suivi de commande"
      onClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBox}>
            <Typography variant="subtitle" style={styles.dateTitle}>
              {formatFullDate(order.createdAt)}
            </Typography>
            <View
              style={[
                styles.modeBadge,
                isCancelled && styles.modeBadgeCancelled,
              ]}
            >
              <Ionicons
                name={isCancelled ? "close-circle" : "bicycle"}
                size={16}
                color={isCancelled ? Colors.error : Colors.text}
              />
              <Typography
                variant="body"
                style={[
                  styles.modeText,
                  isCancelled && { color: Colors.error },
                ]}
              >
                {isCancelled ? "Annulée" : "Livraison"}
              </Typography>
            </View>
          </View>

          <View style={styles.progressContainer}>
            {isCancelled ? (
              <View style={styles.cancelledBox}>
                <Typography variant="body" style={styles.cancelledTitle}>
                  Commande annulée
                </Typography>
                {(order as any).cancellationReason && (
                  <Typography variant="body" style={styles.cancelledReason}>
                    Motif : {(order as any).cancellationReason}
                  </Typography>
                )}
              </View>
            ) : (
              <>
                <View style={styles.timelineTrackRow}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="receipt" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.barWrapper}>
                    <Animated.View
                      style={[
                        styles.barFill,
                        {
                          width: bar1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name="bicycle"
                      size={24}
                      color={
                        order.status === "delivering" ||
                        order.status === "completed"
                          ? Colors.primary
                          : Colors.surfaceBorder
                      }
                    />
                  </View>
                  <View style={styles.barWrapper}>
                    <Animated.View
                      style={[
                        styles.barFill,
                        {
                          width: bar2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name="home"
                      size={24}
                      color={
                        order.status === "completed"
                          ? Colors.success
                          : Colors.surfaceBorder
                      }
                    />
                  </View>
                </View>
                <View style={styles.stepsTextRow}>
                  <View style={styles.textContainerLeft}>
                    <Typography
                      variant="body"
                      style={[
                        styles.stepText,
                        order.status === "pending" && styles.stepTextActive,
                      ]}
                    >
                      Confirmée
                    </Typography>
                  </View>
                  <View style={styles.textContainerCenter}>
                    <Typography
                      variant="body"
                      style={[
                        styles.stepText,
                        order.status === "delivering" && styles.stepTextActive,
                      ]}
                    >
                      En route
                    </Typography>
                  </View>
                  <View style={styles.textContainerRight}>
                    <Typography
                      variant="body"
                      style={[
                        styles.stepText,
                        order.status === "completed" && styles.stepTextActive,
                      ]}
                    >
                      Livrée
                    </Typography>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          <Typography variant="body" style={styles.sectionTitle}>
            MA COMMANDE
          </Typography>
          <View style={styles.itemsBox}>
            {order.items?.map((item: any, index: number) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={styles.quantityBadge}>
                    <Typography variant="body" style={styles.quantityText}>
                      {item.quantity}x
                    </Typography>
                  </View>
                  <View>
                    <Typography variant="body" style={styles.itemName}>
                      {item.name}
                    </Typography>
                    {item.note && (
                      <Typography variant="body" style={styles.itemNote}>
                        {item.note}
                      </Typography>
                    )}
                  </View>
                </View>
                <Typography variant="body" style={styles.itemPrice}>
                  {(item.price * item.quantity).toFixed(2)} €
                </Typography>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {order.deliveryAddress && (
            <View style={styles.addressContainer}>
              <Typography variant="body" style={styles.sectionTitle}>
                LIVRAISON À
              </Typography>
              <View style={styles.addressBox}>
                <Ionicons
                  name="location"
                  size={24}
                  color={Colors.primary}
                  style={styles.addressIcon}
                />
                <View style={styles.addressTextContainer}>
                  <Typography variant="body" style={styles.boldText}>
                    {order.deliveryAddress.street}
                  </Typography>
                  <Typography variant="body" style={styles.addressText}>
                    {order.deliveryAddress.city}
                  </Typography>
                  {order.deliveryAddress.details ? (
                    <Typography variant="body" style={styles.addressDetails}>
                      {order.deliveryAddress.details}
                    </Typography>
                  ) : null}
                </View>
              </View>
              <View style={styles.divider} />
            </View>
          )}

          <View style={styles.totalRow}>
            <Typography variant="subtitle" style={styles.totalLabel}>
              Total
            </Typography>
            <Typography variant="price" style={styles.totalValue}>
              {order.totalAmount.toFixed(2)} €
            </Typography>
          </View>

          {/* BOUTON D'ANNULATION */}
          {order.status === "pending" && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelOrder}
            >
              <Typography variant="body" style={styles.cancelBtnText}>
                Annuler ma commande
              </Typography>
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: { flexShrink: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dateTitle: { textTransform: "capitalize", fontSize: 18, marginBottom: 0 },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 6,
  },
  modeBadgeCancelled: {
    backgroundColor: Colors.error + "15",
    borderColor: Colors.error + "30",
  },
  modeText: {
    marginBottom: 0,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  progressContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 10,
  },
  timelineTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconWrapper: { alignItems: "center", justifyContent: "center", width: 32 },
  barWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 4 },
  stepsTextRow: { flexDirection: "row", justifyContent: "space-between" },
  textContainerLeft: { flex: 1, alignItems: "flex-start" },
  textContainerCenter: { flex: 1, alignItems: "center" },
  textContainerRight: { flex: 1, alignItems: "flex-end" },
  stepText: { fontSize: 13, color: Colors.textMuted, marginBottom: 0 },
  stepTextActive: { color: Colors.text, fontFamily: "Inter_700Bold" },
  cancelledBox: { alignItems: "center", paddingVertical: 10 },
  cancelledTitle: {
    color: Colors.error,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 8,
  },
  cancelledReason: {
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 20,
  },
  itemsBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  quantityBadge: {
    backgroundColor: Colors.surfaceLight,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    marginBottom: 0,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  itemName: {
    marginBottom: 0,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  itemNote: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginBottom: 0,
    marginTop: 2,
  },
  itemPrice: { marginBottom: 0, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  addressContainer: { marginBottom: 0 },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 16,
  },
  addressIcon: {
    backgroundColor: Colors.primary + "15",
    padding: 10,
    borderRadius: 12,
  },
  addressTextContainer: { flex: 1 },
  addressText: { marginBottom: 2, color: Colors.textMuted },
  addressDetails: {
    marginBottom: 0,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  boldText: {
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 2,
    fontSize: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary + "10",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  totalLabel: { marginBottom: 0, color: Colors.primary },
  totalValue: { fontSize: 24, color: Colors.primary },

  cancelBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error + "50",
    backgroundColor: Colors.error + "10",
    alignItems: "center",
  },
  cancelBtnText: {
    color: Colors.error,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 0,
  },

  bottomSpacer: { height: 40 },
});
