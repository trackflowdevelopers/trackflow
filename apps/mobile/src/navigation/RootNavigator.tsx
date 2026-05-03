import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemeTokens } from '@trackflow/shared-types';

import { HomeScreen } from '../screens/HomeScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { RouteMapScreen } from '../screens/RouteMapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Icon, type IconName } from '../components/Icon';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';
import type { RootStackParamList, TabsParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeTabStyles(theme), [theme]);

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
                color={focused ? '#FFFFFF' : theme.text2}
              />
              <Text
                style={{
                  color: focused ? '#FFFFFF' : theme.text2,
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
  const { theme } = useTheme();
  const navTheme = useMemo(
    () => ({
      ...(theme.isDark ? DarkTheme : DefaultTheme),
      dark: theme.isDark,
      colors: {
        ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: theme.bg,
        card: theme.bg,
        text: theme.text,
        border: 'transparent',
        primary: colors.primary,
      },
    }),
    [theme],
  );

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="RouteMap" component={RouteMapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function makeTabStyles(theme: ThemeTokens) {
  return StyleSheet.create({
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
      backgroundColor: theme.navBg,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      borderRadius: 22,
      shadowColor: theme.cardShadow,
      shadowOpacity: theme.isDark ? 0 : 1,
      shadowRadius: theme.isDark ? 0 : 16,
      shadowOffset: { width: 0, height: theme.isDark ? 0 : 8 },
      elevation: theme.isDark ? 0 : 8,
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
}
