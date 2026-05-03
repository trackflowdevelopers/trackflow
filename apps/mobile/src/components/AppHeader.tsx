import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface AppHeaderProps {
  title?: string | null;
  subtitle?: string | null;
  onBack?: () => void;
}

export function AppHeader({ title, subtitle, onBack }: AppHeaderProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 18,
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
            borderColor: colors.borderStrong,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="logo" size={26} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={{ fontWeight: '700', fontSize: 18, letterSpacing: -0.3, color: colors.text }}>
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
              color: colors.text,
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={{ fontSize: 12, color: colors.text2, marginTop: 1 }}>{subtitle}</Text>
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
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
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
                paddingHorizontal: 10,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.text : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: active ? colors.bg : colors.text2,
                }}
              >
                {l}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Icon name="bell" size={17} color={colors.text} />
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
            borderColor: colors.bg,
          }}
        />
      </TouchableOpacity>
    </View>
  );
}
