import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

interface AppHeaderProps {
  title?: string | null;
  subtitle?: string | null;
  onBack?: () => void;
}

export function AppHeader({ title, subtitle, onBack }: AppHeaderProps) {
  const { i18n } = useTranslation();
  const { theme, themeName, toggleTheme } = useTheme();
  const lang = i18n.language;

  const anim = useRef(new Animated.Value(themeName === 'dark' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: themeName === 'dark' ? 0 : 1,
      duration: 280,
      easing: Easing.bezier(0.5, 1.4, 0.4, 1),
      useNativeDriver: true,
    }).start();
  }, [themeName, anim]);

  const sunTranslateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const sunRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] });
  const moonTranslateY = anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const moonRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.iconBtnBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrow-left" size={18} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="logo" size={26} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={{ fontWeight: '700', fontSize: 18, letterSpacing: -0.3, color: theme.text }}>
            Track<Text style={{ color: colors.primary }}>Flow</Text>
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {title && (
          <Text
            style={{
              fontWeight: '700',
              fontSize: 17,
              color: theme.text,
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={{ fontSize: 12, color: theme.text2, marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 30,
          padding: 2,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.iconBtnBg,
        }}
      >
        {(['uz', 'ru'] as const).map((l) => {
          const active = lang === l;
          return (
            <TouchableOpacity
              key={l}
              onPress={() => i18n.changeLanguage(l)}
              style={{
                height: 26,
                paddingHorizontal: 9,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? theme.chipBgActive : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: active ? theme.chipFgActive : theme.text2,
                }}
              >
                {l}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={toggleTheme}
        accessibilityLabel="Toggle theme"
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.iconBtnBg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            transform: [{ translateY: sunTranslateY }, { rotate: sunRotate }],
          }}
        >
          <Icon name="sun" size={17} color={theme.themeToggleFg} />
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            transform: [{ translateY: moonTranslateY }, { rotate: moonRotate }],
          }}
        >
          <Icon name="moon" size={16} color={theme.themeToggleFg} />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.iconBtnBg,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Icon name="bell" size={17} color={theme.text2} />
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: colors.offline,
            borderWidth: 2,
            borderColor: theme.bg,
          }}
        />
      </TouchableOpacity>
    </View>
  );
}
