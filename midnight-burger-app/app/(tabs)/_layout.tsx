import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, ImageSourcePropType, Platform, StyleSheet, View } from 'react-native';

type AnimatedTabIconProps = {
  focused: boolean;
  source: ImageSourcePropType;
};

function AnimatedTabIcon({ focused, source }: AnimatedTabIconProps) {
  const animValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [focused]);

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const color = focused ? Colors.primary : Colors.textMuted;

  return (
    <View style={styles.iconContainer}>
      <Animated.Image
        source={source}
        style={[
          styles.icon,
          {
            tintColor: color,
            transform: [{ scale }],
          },
        ]}
      />

      {/* Un simple petit point/pilule très élégant sous l'icône */}
      <Animated.View
        style={[
          styles.activeIndicatorLine,
          {
            opacity: animValue,
            backgroundColor: Colors.primary,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

// ------------------------------------------------------------------
// 2. LAYOUT PRINCIPAL
// ------------------------------------------------------------------
export default function TabsLayout() {

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIconStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarItemStyle: styles.tabBarItem,
          tabBarStyle: styles.tabBar,
        }}
        screenListeners={{
          tabPress: () => {
            feedbackService.light();
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} source={require('../../assets/icons/cheeseburger.png')} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} source={require('../../assets/icons/profile.png')} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

// ------------------------------------------------------------------
// 3. STYLES
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(10, 10, 12, 0.96)', // Noir très profond et élégant
    height: Platform.OS === 'ios' ? 95 : 80,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)', // Bordure ultra-fine
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  activeIndicatorLine: {
    position: 'absolute',
    bottom: 4,
    width: 8,
    height: 2,
    borderRadius: 3,
  },
});