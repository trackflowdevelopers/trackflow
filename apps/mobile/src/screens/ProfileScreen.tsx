import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemeTokens } from '@trackflow/shared-types';

import { AppHeader } from '../components/AppHeader';
import { Card } from '../components/Card';
import { Stat } from '../components/Stat';
import { Icon } from '../components/Icon';
import { SettingRow } from '../components/SettingRow';
import { colors } from '../theme/colors';
import { useAuth } from '../context/useAuth';
import { getCompanyById, getVehicles } from '../api/vehicles';
import { useTheme } from '../theme/useTheme';

interface ProfileScreenProps {
  noop?: never;
}

export function ProfileScreen(_props: ProfileScreenProps = {}) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { theme, themeName, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { data: company } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => getCompanyById(user!.companyId),
    enabled: Boolean(user?.companyId),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', { mobile: true }],
    queryFn: () => getVehicles({ limit: 100 }),
  });

  const stats = useMemo(() => {
    const vehicles = vehiclesData?.data ?? [];
    const totalCars = vehicles.length;
    const driversSet = new Set<string>();
    let monthlyFuel = 0;
    for (const v of vehicles) {
      if (v.currentDriverId) driversSet.add(v.currentDriverId);
      monthlyFuel += (v.totalMileage / 100) * v.fuelConsumptionNorm * 0.1;
    }
    return {
      totalCars,
      drivers: driversSet.size,
      monthlyFuel: Math.round(monthlyFuel),
      saved: Math.round(monthlyFuel * 0.18),
    };
  }, [vehiclesData]);

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '–';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppHeader />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginBottom: 14,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: theme.isDark ? colors.primarySoft : `${colors.primary}14`,
            borderWidth: 1,
            borderColor: theme.borderStrong,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 20 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>
              {t('profile.user_role')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <Icon name="shield" size={11} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                {company?.name ?? t('profile.company')}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: theme.text3,
            marginBottom: 8,
          }}
        >
          {t('profile.fleet_stats')}
        </Text>

        <View style={{ marginBottom: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat label={t('profile.total_cars')} value={stats.totalCars} />
            <Stat label={t('profile.drivers_count')} value={stats.drivers} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat label={t('profile.monthly_fuel')} value={stats.monthlyFuel} unit="L" />
            <Stat
              label={t('profile.saved')}
              value={`${stats.saved}`}
              unit="L"
              sub={`~18%`}
            />
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: theme.text3,
            marginBottom: 8,
          }}
        >
          {t('profile.settings')}
        </Text>

        <Card padding={0}>
          <SettingRow icon="bell" label={t('profile.notifications')} value="On" theme={theme} />
          <SettingRow
            icon="globe"
            label={t('profile.language')}
            value={i18n.language === 'uz' ? 'O\'zbek' : 'Русский'}
            onPress={() => i18n.changeLanguage(i18n.language === 'uz' ? 'ru' : 'uz')}
            theme={theme}
          />
          <SettingRow
            icon={themeName === 'dark' ? 'moon' : 'sun'}
            label={t('profile.theme')}
            value={themeName === 'dark' ? 'Dark' : 'Light'}
            onPress={toggleTheme}
            theme={theme}
            last
          />
        </Card>

        <TouchableOpacity
          onPress={logout}
          style={{
            marginTop: 16,
            height: 50,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.offlineRing,
            backgroundColor: colors.offlineBg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Icon name="logout" size={18} color={colors.offline} />
          <Text style={{ color: colors.offline, fontSize: 14, fontWeight: '600' }}>
            {t('profile.logout')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
  });
}
