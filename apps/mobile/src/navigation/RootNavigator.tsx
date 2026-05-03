import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Icon, type IconName } from '../components/Icon';
import { colors } from '../theme/colors';
import type { RootStackParamList, TabsParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: 'transparent',
    primary: colors.primary,
  },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const items: { route: 'Home' | 'Profile'; icon: IconName; label: string }[] = [
    { route: 'Home', icon: 'home', label: t('nav.home') },
    { route: 'Profile', icon: 'user', label: t('nav.profile') },
  ];

  return (
    <View
      style={[styles.tabBarWrap, { paddingBottom: insets.bottom + 12 }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBar}>
        {items.map((it) => {
          const idx = state.routes.findIndex((r) => r.name === it.route);
          const focused = state.index === idx;
          const route = state.routes[idx];
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };
          return (
            <TouchableOpacity
              key={it.route}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: focused ? colors.primary : 'transparent',
                },
              ]}
            >
              <Icon
                name={it.icon}
                size={18}
                color={focused ? colors.text : 'rgba(255,255,255,0.6)'}
              />
              <Text
                style={{
                  color: focused ? colors.text : 'rgba(255,255,255,0.6)',
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {it.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    backgroundColor: 'rgba(20,30,52,0.92)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 22,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 16,
  },
});
