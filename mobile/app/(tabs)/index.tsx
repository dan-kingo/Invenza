import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import itemService from '../../services/item.service';
import notificationService from '../../services/notification.service';
import alertService from '../../services/alert.service';
import { useNotifications } from '@/hooks/useNotifications';

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  categories: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    categories: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
const { expoPushToken, notification } = useNotifications();
  useEffect(() => {
    loadDashboardData();
  }, []);

   useEffect(() => {
    if (notification) {
      console.log('New notification received, refreshing data...');
      loadDashboardData();
    }
  }, [notification]);


  const loadDashboardData = async () => {
    try {
      const [items, alerts, notifications] = await Promise.all([
        itemService.listItems(),
        alertService.getAlerts(false),
        notificationService.getUnreadCount(),
      ]);

      const categories = new Set(items.map((item: any) => item.category).filter(Boolean));

      const lowStockCount = alerts.alerts.filter(
        (alert: any) => alert.type === 'low_stock' || alert.type === 'out_of_stock'
      ).length;

      setStats({
        totalItems: items.length,
        lowStockItems: lowStockCount,
        totalValue: items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
        categories: categories.size,
      });

      setRecentItems(items.slice(0, 5));

      const lowStockItems = alerts.alerts
        .filter((alert: any) => alert.type === 'low_stock' || alert.type === 'out_of_stock')
        .slice(0, 3)
        .map((alert: any) => ({
          _id: alert.itemId._id,
          name: alert.itemId.name,
          quantity: alert.currentQuantity,
          unit: alert.itemId.unit,
          category: alert.itemId.category,
        }));

      setLowStockAlerts(lowStockItems);
      setUnreadNotifications(notifications.count);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={styles.greeting}>
              Welcome back,
            </Text>
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.name || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
            <MaterialCommunityIcons name="bell" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="package-variant"
            label="Total Items"
            value={stats.totalItems.toString()}
            gradient={[colors.primary, colors.secondary]}
          />
          <StatCard
            icon="alert-circle"
            label="Low Stock"
            value={stats.lowStockItems.toString()}
            gradient={[colors.error, colors.warning]}
          />
          <StatCard
            icon="cube-outline"
            label="Total Units"
            value={stats.totalValue.toString()}
            gradient={[colors.secondary, colors.primary]}
          />
          <StatCard
            icon="tag-multiple"
            label="Categories"
            value={stats.categories.toString()}
            gradient={[colors.success, colors.secondary]}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
          </View>
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="qrcode-scan"
              label="Scan Item"
              onPress={() => router.push('/(tabs)/scan')}
              gradient={[colors.primary, colors.secondary]}
            />
            <ActionCard
              icon="plus-circle"
              label="Add Item"
              onPress={() => router.push('/(tabs)/stock')}
              gradient={[colors.secondary, colors.primary]}
            />
            <ActionCard
              icon="chart-bar"
              label="View Reports"
              onPress={() => router.push('/(tabs)/reports')}
              gradient={[colors.accent, colors.secondary]}
            />
            <ActionCard
              icon="package-variant"
              label="View Stock"
              onPress={() => router.push('/(tabs)/stock')}
              gradient={[colors.success, colors.primary]}
            />
          </View>
        </View>

        {lowStockAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Low Stock Alerts
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/stock')}>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>
            {lowStockAlerts.map((item) => (
              <TouchableOpacity
                key={item._id}
                onPress={() => router.push(`/stock/item-detail?id=${item._id}`)}
              >
                <Card style={styles.alertCard}>
                  <Card.Content style={styles.alertCardContent}>
                  <View style={styles.alertIcon}>
                    <MaterialCommunityIcons name="alert" size={24} color={colors.error} />
                  </View>
                  <View style={styles.alertInfo}>
                    <Text variant="titleMedium" style={styles.alertTitle}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.alertSubtitle}>
                      Only {item.quantity} {item.unit} remaining
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    iconColor={colors.textMuted}
                    size={20}
                    onPress={() => router.push(`/stock/item-detail?id=${item._id}`)}
                  />
                </Card.Content>
              </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Recent Items
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/stock')}>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentItems.map((item) => (
              <TouchableOpacity
                key={item._id}
                onPress={() => router.push(`/stock/item-detail?id=${item._id}`)}
              >
                <Card style={styles.itemCard}>
                  <Card.Content style={styles.itemCardContent}>
                  <View style={styles.itemIcon}>
                    <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text variant="titleMedium" style={styles.itemTitle}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.itemSubtitle}>
                      {item.quantity} {item.unit} {item.category ? `• ${item.category}` : ''}
                    </Text>
                  </View>
                  <View style={styles.itemStatus}>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.statusBadge,
                        item.quantity <= (item.minThreshold || 0)
                          ? styles.statusLow
                          : styles.statusNormal,
                      ]}
                    >
                      {item.quantity <= (item.minThreshold || 0) ? 'Low' : 'OK'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: string;
  label: string;
  value: string;
  gradient: string[];
}) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardGradient}
      >
        <MaterialCommunityIcons name={icon as any} size={28} color={colors.text} />
        <Text variant="headlineSmall" style={styles.statValue}>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.statLabel}>
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
  gradient,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  gradient: string[];
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <LinearGradient
        colors={gradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionCardGradient}
      >
        <MaterialCommunityIcons name={icon as any} size={32} color={colors.text} />
        <Text variant="bodySmall" style={styles.actionLabel}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greeting: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    color: colors.text,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: colors.text + 'CC',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  seeAllButton: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  actionLabel: {
    color: colors.text,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: colors.surface,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    color: colors.text,
    marginBottom: 4,
  },
  alertSubtitle: {
    color: colors.textSecondary,
  },
  itemCard: {
    backgroundColor: colors.surface,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  itemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    color: colors.textSecondary,
  },
  itemStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  statusLow: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  statusNormal: {
    backgroundColor: colors.success + '20',
    color: colors.success,
  },
});
