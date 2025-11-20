import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });

    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="headlineMedium" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={colors.gradient.primary as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>I</Text>
            </LinearGradient>
          </View>

          <Text variant="displaySmall" style={styles.title}>
            Invenza
          </Text>

          <Text variant="bodyLarge" style={styles.subtitle}>
            Smart Inventory Management
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="📦"
            title="Track Inventory"
            description="Real-time tracking of all your items"
          />
          <FeatureItem
            icon="🏷️"
            title="Smart Tags"
            description="NFC/QR code integration for quick access"
          />
          {/* <FeatureItem
            icon="📊"
            title="Analytics"
            description="Insights and reports at your fingertips"
          /> */}
          <FeatureItem
            icon="🔔"
            title="Alerts"
            description="Get notified on low stock instantly"
          />
        </View>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/login')}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonLabel}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/auth/register')}
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>
        </View>
      </View>
    </View>
  );
}

const FeatureItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <LinearGradient
        colors={[colors.primary + '20', colors.secondary + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIconGradient}
      >
        <Text style={styles.featureIcon}>{icon}</Text>
      </LinearGradient>
    </View>
    <View style={styles.featureTextContainer}>
      <Text variant="titleMedium" style={styles.featureTitle}>
        {title}
      </Text>
      <Text variant="bodySmall" style={styles.featureDescription}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  features: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + '80',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  featureIconContainer: {
    marginRight: 16,
  },
  featureIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: colors.textSecondary,
  },
  actions: {
    gap: 12,
    marginTop: 40,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryButton: {
    borderColor: colors.secondary,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  buttonContent: {
    height: 56,
  },
});
