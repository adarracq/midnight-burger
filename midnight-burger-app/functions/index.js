const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.processLoyaltyOnOrderCompletion = onDocumentUpdated("orders/{orderId}", async (event) => {
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();

    if (!newValue || !previousValue) return;

    const userId = newValue.userId;
    const userRef = admin.firestore().collection('users').doc(userId);

    try {
        // --- 🟢 DÉBUT NOUVELLE LOGIQUE DE NOTIFICATION ---
        // On vérifie si le statut a changé
        if (newValue.status !== previousValue.status) {
            // On récupère le token de l'utilisateur
            const userDocForPush = await userRef.get();
            const pushToken = userDocForPush.data()?.expoPushToken;

            if (pushToken) {
                let messageTitle = "";
                let messageBody = "";

                // On définit le message selon le nouveau statut
                if (newValue.status === 'delivering') {
                    messageTitle = "Commande en route !";
                    messageBody = "Votre livreur est en chemin vers vous.";
                } else if (newValue.status === 'completed') {
                    messageTitle = "Commande livrée !";
                    messageBody = "Bon appétit et à bientôt chez Midnight.";
                } else if (newValue.status === 'cancelled') {
                    messageTitle = "Commande annulée";
                    messageBody = "Désolé, votre commande a été annulée (plus de détails dans l'app).";
                }

                // Si on a un message à envoyer, on fait un simple fetch vers l'API d'Expo
                if (messageTitle !== "") {
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: pushToken,
                            sound: 'default',
                            title: messageTitle,
                            body: messageBody,
                            data: { orderId: event.params.orderId }, // Tu peux passer des données invisibles
                        }),
                    });
                }
            }
        }
        // --- 🟢 FIN NOUVELLE LOGIQUE DE NOTIFICATION ---

        // ... Le reste de ton code avec la Transaction Firebase (Points, Classement, etc.)
        await admin.firestore().runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return;
            const userData = userDoc.data();

            // 🟢 CAS 1 : COMMANDE TERMINÉE (Le client GAGNE des points)
            if (newValue.status === 'completed' && previousValue.status !== 'completed') {
                // On ne déduit plus les points utilisés ici, ça a été fait dans l'app mobile !
                const pointsEarned = Math.floor(newValue.totalAmount);

                const newTotalSpent = (userData.totalSpent || 0) + newValue.totalAmount;
                const newOrderCount = (userData.orderCount || 0) + 1;

                const newLoyaltyPoints = (userData.loyaltyPoints || 0) + pointsEarned;
                const newLifetimePoints = (userData.lifetimePoints || 0) + pointsEarned;

                transaction.update(userRef, {
                    totalSpent: newTotalSpent,
                    orderCount: newOrderCount,
                    loyaltyPoints: newLoyaltyPoints,
                    lifetimePoints: newLifetimePoints
                });

                // Mise à jour du classement
                const leaderboardRef = admin.firestore().collection('leaderboard').doc(userId);
                transaction.set(leaderboardRef, {
                    pseudo: userData.pseudo || '',
                    points: newLifetimePoints,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // 🟢 CAS 2 : COMMANDE ANNULÉE (On REMBOURSE les points)
            if (newValue.status === 'cancelled' && previousValue.status !== 'cancelled') {
                const pointsUsed = newValue.pointsUsed || 0;

                if (pointsUsed > 0) {
                    const refundedLoyaltyPoints = (userData.loyaltyPoints || 0) + pointsUsed;
                    transaction.update(userRef, {
                        loyaltyPoints: refundedLoyaltyPoints
                    });
                    console.log(`Remboursement de ${pointsUsed} pts à l'utilisateur ${userId}`);
                }
            }
        });
    } catch (error) {
        console.error("Erreur lors du calcul de fidélité :", error);
    }
});