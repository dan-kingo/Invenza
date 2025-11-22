import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler, Animated, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text, Button } from 'react-native-paper';
import LogoWithText from './components/LogoWithText';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.7;
const CARD_MARGIN = 12;
const FEATURE_CARD_WIDTH = CARD_WIDTH + CARD_MARGIN * 2;

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<FeatureItem>>(null);

  const features: FeatureItem[] = [
    {
      icon: "📦",
      title: "Track Inventory",
      description: "Real-time tracking of all your items"
    },
    {
      icon: "🏷️",
      title: "Smart Tags",
      description: "NFC/QR code integration for quick access"
    },
    {
      icon: "🔔",
      title: "Alerts",
      description: "Get notified on low stock instantly"
    }
  ];

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

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % features.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / FEATURE_CARD_WIDTH);
    setCurrentIndex(index);
  };

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
          <LogoWithText imageSource={require('../assets/images/logo.png')} />
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.cardsSection}>
            <Animated.FlatList
              ref={flatListRef}
              data={features}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={FEATURE_CARD_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={styles.flatListContent}
              onScroll={onScroll}
              onMomentumScrollEnd={onMomentumScrollEnd}
              scrollEventThrottle={16}
              renderItem={({ item, index }) => {
                const inputRange = [
                  (index - 1) * FEATURE_CARD_WIDTH,
                  index * FEATURE_CARD_WIDTH,
                  (index + 1) * FEATURE_CARD_WIDTH,
                ];

                const scale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.9, 1, 0.9],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.6, 1, 0.6],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    style={[
                      styles.featureCardWrapper,
                      {
                        transform: [{ scale }],
                        opacity,
                      },
                    ]}
                  >
                    <FeatureCard icon={item.icon} title={item.title} description={item.description} />
                  </Animated.View>
                );
              }}
            />
            
            {/* Pagination Indicators */}
            <View style={styles.pagination}>
              {features.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: 
                        index === currentIndex ? colors.primary : colors.textSecondary + '40',
                    }
                  ]}
                />
              ))}
            </View>
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
    </View>
  );
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <View style={styles.featureCard}>
    <LinearGradient
      colors={[colors.surface, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardContent}>
        <LinearGradient
          colors={[colors.primary + '40', colors.secondary + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureIconGradient}
        >
          <Text style={styles.featureIcon}>{icon}</Text>
        </LinearGradient>
        
        <View style={styles.cardText}>
          <Text variant="titleMedium" style={styles.featureTitle}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.featureDescription}>
            {description}
          </Text>
        </View>
      </View>
      
      {/* Shine effect */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shineEffect}
      />
    </LinearGradient>
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
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  flatListContent: {
    paddingHorizontal: (screenWidth - FEATURE_CARD_WIDTH) / 2,
    alignItems: 'center',
  },
  featureCardWrapper: {
    width: FEATURE_CARD_WIDTH,
    paddingHorizontal: CARD_MARGIN,
  },
  featureCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 32,
  },
  cardText: {
    alignItems: 'center',
  },
  featureTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 18,
  },
  featureDescription: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    opacity: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    gap: 12,
    marginTop: 20,
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