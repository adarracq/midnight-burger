import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CartProvider } from '@/src/context/CartContext';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// 🟢 Nouveaux imports pour les notifications
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Garde le splash screen visible tant que les polices ne sont pas chargées
SplashScreen.preventAutoHideAsync();

// 🟢 Configuration pour que les notifications s'affichent même si l'application est ouverte (au premier plan)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 🟢 Initialisation des notifications à la connexion de l'utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await registerForPushNotificationsAsync(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return null; // ou un composant de chargement
  }

  return (
    <CartProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </CartProvider>
  );
}

// 🟢 Fonction autonome pour demander la permission et sauvegarder le token
async function registerForPushNotificationsAsync(uid: string) {
  if (!Device.isDevice) {
    console.log('Les notifications Push ne fonctionnent pas sur simulateur.');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission refusée pour les notifications.');
      return;
    }

    // Récupère le token unique du téléphone
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Sauvegarde le token dans le profil de l'utilisateur sur Firestore
    await updateDoc(doc(db, 'users', uid), {
      expoPushToken: token
    });

    console.log("Token de notification enregistré avec succès !");

  } catch (error) {
    console.error("Erreur lors de l'enregistrement du token de notification :", error);
  }
}