// src/screens/cart/CartModal.tsx
import { BaseBottomSheet } from "@/src/components/molecules/BaseBottomSheet";
import { AuthForm } from "@/src/components/organisms/AuthForm";
import { AVAILABLE_CITIES } from "@/src/constants/cities";
import { Colors } from "@/src/constants/theme";
import { feedbackService } from "@/src/services/feedbackService";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react"; // 🟢 Ajout de useRef
import { FlatList, StyleSheet, Switch, TextInput, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { auth, db } from "../../../firebaseConfig";
import { Button } from "../../components/atoms/Button";
import { Typography } from "../../components/atoms/Typography";
import { CartItemRow } from "../../components/molecules/CartItemRow";
import { CustomAlert } from "../../components/molecules/CustomAlert";
import { useCart } from "../../context/CartContext";
import { Product } from "../../models/Product";

interface CartModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CartModal = ({ isVisible, onClose }: CartModalProps) => {
  const { cart, addToCart, removeFromCart, cartTotal, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [userRank, setUserRank] = useState<number | null>(null);

  const [phone, setPhone] = useState("");

  const [formattedAddress, setFormattedAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [useFreeBurger, setUseFreeBurger] = useState(false);

  // 🟢 Création de la référence pour le champ Google
  const googlePlacesRef = useRef<any>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
    onCloseAction?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
      setUser(currentUser),
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchUserAndRank = async () => {
      if (user && isVisible) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            if (data.phone) setPhone(data.phone);
            if (data.savedAddress) {
              setFormattedAddress(data.savedAddress.street || "");
              setCity(data.savedAddress.city || "");
              setLat(data.savedAddress.lat || null);
              setLng(data.savedAddress.lng || null);
              setDetails(data.savedAddress.details || "");

              // 🟢 Remplissage manuel de l'adresse au chargement pour éviter le bug du defaultValue
              setTimeout(() => {
                googlePlacesRef.current?.setAddressText(
                  data.savedAddress.street || "",
                );
              }, 500);
            }
          }
          const rankQuery = query(
            collection(db, "leaderboard"),
            orderBy("points", "desc"),
            limit(10),
          );
          const snap = await getDocs(rankQuery);
          const index = snap.docs.findIndex((d) => d.id === user.uid);
          if (index !== -1) setUserRank(index + 1);
        } catch (error) {
          console.error("Erreur :", error);
        }
      }
    };
    fetchUserAndRank();
  }, [user, isVisible]);

  const groupedCart = cart.reduce(
    (acc, item) => {
      const found = acc.find((i) => i.product.id === item.id);
      if (found) {
        found.quantity += 1;
      } else {
        acc.push({ product: item, quantity: 1, note: item.note });
      }
      return acc;
    },
    [] as { product: Product; quantity: number; note: string }[],
  );

  const hasEnoughPoints = userData && userData.loyaltyPoints >= 100;

  let freeBurgerValue = 0;
  const eligibleBurger = cart.find((item) => item.category === "burger");
  if (useFreeBurger && eligibleBurger) {
    freeBurgerValue = eligibleBurger.price;
  }

  let freeCanValue = 0;
  let missingCanForPromo = false;
  if (userRank === 4 || userRank === 5) {
    const drink = cart.find((item) => item.category === "drink");
    if (drink) {
      freeCanValue = drink.price;
    } else {
      missingCanForPromo = true;
    }
  }

  let percentageDiscount = 0;
  let discountLabel = "";
  if (userRank === 1) {
    percentageDiscount = 0.2;
    discountLabel = "1er du Classement (-20%)";
  } else if (userRank === 2) {
    percentageDiscount = 0.15;
    discountLabel = "2ème du Classement (-15%)";
  } else if (userRank === 3) {
    percentageDiscount = 0.1;
    discountLabel = "3ème du Classement (-10%)";
  }

  const subtotalAfterFreebies = Math.max(
    0,
    cartTotal - freeBurgerValue - freeCanValue,
  );
  const discountAmount = subtotalAfterFreebies * percentageDiscount;
  const finalTotal = Math.max(0, subtotalAfterFreebies - discountAmount);

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "info",
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

  const handlePlaceOrder = async () => {
    const currentHour = new Date().getHours();
    const isOpen = currentHour >= 23 || currentHour < 6;

    if (!isOpen) {
      return showAlert(
        "Fermé",
        "Nous sommes actuellement fermés.\nLes commandes sont disponibles de 23h00 à 06h00.",
        "error",
      );
    }

    if (!user) return;
    if (!phone.trim())
      return showAlert(
        "Erreur",
        "Le numéro de téléphone est obligatoire.",
        "error",
      );

    if (!formattedAddress.trim() || !lat || !lng)
      return showAlert(
        "Erreur",
        "Veuillez sélectionner une adresse valide dans la liste proposée par Google.",
        "error",
      );

    const isCityAllowed = AVAILABLE_CITIES.filter(
      (c) => c !== "Autres" && c !== "autre" && c !== "Autres ",
    ) // On exclut l'option "Autres"
      .some((c) => c.toLowerCase().trim() === city.toLowerCase().trim());

    if (!isCityAllowed) {
      return showAlert(
        "Zone non desservie",
        `Désolé, nous ne livrons pas à ${city || "cette adresse"}.\n\nVoici nos zones de livraison : ${AVAILABLE_CITIES.filter((c) => c !== "Autres").join(", ")}.`,
        "info",
      );
    }

    setLoading(true);
    try {
      const addressObj = {
        street: formattedAddress,
        city: city,
        details,
        lat,
        lng,
      };

      const orderData = {
        userId: user.uid,
        firstName: userData?.firstName || "Client",
        lastName: userData?.lastName || "",
        pseudo: userData?.pseudo || "",
        phone: phone.trim(),
        items: groupedCart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          note: i.note || "",
        })),
        totalAmount: finalTotal,
        subTotal: cartTotal,
        pointsUsed: useFreeBurger ? 100 : 0,
        discountApplied:
          discountLabel || (freeCanValue > 0 ? "Canette offerte" : "Aucune"),
        status: "pending",
        deliveryAddress: addressObj,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);

      const userUpdates: any = {
        phone: phone.trim(),
        savedAddress: addressObj,
      };

      if (useFreeBurger) {
        userUpdates.loyaltyPoints = increment(-100);
      }
      await updateDoc(doc(db, "users", user.uid), userUpdates);

      showAlert(
        "Commande validée !",
        "Elle est en cours de préparation.",
        "success",
        () => {
          setUseFreeBurger(false);
          clearCart();
          onClose();
        },
      );
    } catch (error: any) {
      showAlert("Erreur", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseBottomSheet isVisible={isVisible} title="Mon Panier" onClose={onClose}>
      <View style={styles.container}>
        <FlatList
          data={groupedCart}
          keyExtractor={(item) => item.product.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Typography variant="body" style={styles.sectionSubtitle}>
              MA COMMANDE
            </Typography>
          }
          renderItem={({ item }) => (
            <CartItemRow
              product={item.product}
              note={item.note}
              quantity={item.quantity}
              onAdd={() => {
                feedbackService.light();
                addToCart(item.product, "");
              }}
              onRemove={() => {
                feedbackService.error();
                removeFromCart(item.product.id);
              }}
            />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {user && (hasEnoughPoints || missingCanForPromo) && (
                <View style={styles.promoContainer}>
                  {hasEnoughPoints && eligibleBurger && (
                    <View style={styles.promoRow}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" style={styles.promoTitle}>
                          Burger Gratuit (100 pts)
                        </Typography>
                        <Typography variant="body" style={styles.promoSub}>
                          Tu as {userData.loyaltyPoints} pts. Utiliser ?
                        </Typography>
                      </View>
                      <Switch
                        value={useFreeBurger}
                        onValueChange={setUseFreeBurger}
                        trackColor={{
                          true: Colors.text,
                          false: Colors.textMuted,
                        }}
                        thumbColor={
                          useFreeBurger ? Colors.primary : Colors.text
                        }
                      />
                    </View>
                  )}
                  {hasEnoughPoints && !eligibleBurger && (
                    <Typography variant="body" style={styles.promoHint}>
                      Ajoute un burger pour utiliser tes 100 points !
                    </Typography>
                  )}
                  {missingCanForPromo && (
                    <Typography variant="body" style={styles.promoHint}>
                      Tu es Top 5 ! Ajoute une boisson, elle te sera offerte.
                    </Typography>
                  )}
                </View>
              )}

              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Typography variant="body">Sous-total</Typography>
                  <Typography variant="body">
                    {cartTotal.toFixed(2)} €
                  </Typography>
                </View>
                {freeBurgerValue > 0 && (
                  <View style={styles.receiptRow}>
                    <Typography variant="body" style={styles.discountText}>
                      Burger offert
                    </Typography>
                    <Typography variant="body" style={styles.discountText}>
                      -{freeBurgerValue.toFixed(2)} €
                    </Typography>
                  </View>
                )}
                {freeCanValue > 0 && (
                  <View style={styles.receiptRow}>
                    <Typography variant="body" style={styles.discountText}>
                      Canette offerte
                    </Typography>
                    <Typography variant="body" style={styles.discountText}>
                      -{freeCanValue.toFixed(2)} €
                    </Typography>
                  </View>
                )}
                {discountAmount > 0 && (
                  <View style={styles.receiptRow}>
                    <Typography variant="body" style={styles.discountText}>
                      {discountLabel}
                    </Typography>
                    <Typography variant="body" style={styles.discountText}>
                      -{discountAmount.toFixed(2)} €
                    </Typography>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.receiptRow}>
                  <Typography variant="subtitle" style={styles.totalLabel}>
                    Total à payer
                  </Typography>
                  <Typography variant="price" style={styles.totalValue}>
                    {finalTotal.toFixed(2)} €
                  </Typography>
                </View>
              </View>

              {user ? (
                <View style={styles.checkoutContainer}>
                  <Typography variant="body" style={styles.sectionSubtitle}>
                    MES INFORMATIONS
                  </Typography>
                  <TextInput
                    placeholder="Téléphone *"
                    keyboardType="phone-pad"
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Typography
                    variant="body"
                    style={[styles.sectionSubtitle, { marginTop: 10 }]}
                  >
                    LIVRAISON
                  </Typography>
                  <View style={styles.glassCard}>
                    <GooglePlacesAutocomplete
                      ref={googlePlacesRef} // 🟢 Ajout de la ref
                      placeholder="Saisissez votre adresse de livraison"
                      fetchDetails={true}
                      debounce={300} // 🟢 Ajout du debounce pour ne pas spammer l'API et bloquer les requêtes
                      onPress={(data, details = null) => {
                        if (details) {
                          const addressComponents = details.address_components;
                          const cityObj = addressComponents.find(
                            (c) =>
                              c.types.includes("locality") ||
                              c.types.includes("administrative_area_level_3"),
                          );
                          const extractedCity = cityObj
                            ? cityObj.long_name
                            : "";

                          setFormattedAddress(data.description);
                          setCity(extractedCity);
                          setLat(details.geometry.location.lat);
                          setLng(details.geometry.location.lng);
                          console.log("Adresse sélectionnée :", extractedCity);
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
                          setLat(null);
                          setLng(null);
                          setCity("");
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
                      placeholder="Bâtiment, code porte... (Optionnel)"
                      style={[styles.input, styles.detailsInput]}
                      value={details}
                      onChangeText={setDetails}
                      multiline
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                  <Button
                    title={`Paiement à la livraison — ${finalTotal.toFixed(2)} €`}
                    loading={loading}
                    onPress={handlePlaceOrder}
                  />
                </View>
              ) : (
                <AuthForm titleRegister="Créer un compte pour commander" />
              )}
            </View>
          }
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
    flexShrink: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: { marginVertical: 20 },
  footer: { marginTop: 10, paddingBottom: 50 },
  promoContainer: {
    marginBottom: 20,
    backgroundColor: Colors.primary + "10",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  promoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promoTitle: {
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    marginBottom: 2,
  },
  promoSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 0 },
  promoHint: {
    fontSize: 13,
    color: Colors.warning,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  receiptBox: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  discountText: { color: Colors.success, fontFamily: "Inter_600SemiBold" },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 12,
  },
  totalLabel: { marginBottom: 0 },
  totalValue: { fontSize: 24 },
  checkoutContainer: { marginTop: 10 },
  checkoutTitle: { marginBottom: 16, paddingHorizontal: 10 },
  glassCard: {
    marginTop: 10,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 24,
    zIndex: 100,
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
  detailsInput: { minHeight: 80, textAlignVertical: "top" },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 8,
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
