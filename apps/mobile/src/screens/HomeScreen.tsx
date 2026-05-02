import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Salom, {user?.firstName} {user?.lastName}
      </Text>
      <Text style={styles.role}>{user?.role}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Chiqish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  role: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 48,
  },
  logoutButton: {
    backgroundColor: colors.red,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  logoutText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
