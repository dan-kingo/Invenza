import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator, SegmentedButtons, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import reportService, { StockSummaryItem, LowStockItem, TopSellingItem, CategoryBreakdown } from '../../services/report.service';

type ReportType = 'stock-summary' | 'low-stock' | 'top-selling' | 'category';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('stock-summary');
  const [stockSummary, setStockSummary] = useState<StockSummaryItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [topSelling, setTopSelling] = useState<TopSellingItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [stockRes, lowStockRes, topSellingRes, categoryRes] = await Promise.all([
        reportService.getStockSummary(),
        reportService.getLowStock(),
        reportService.getTopSelling(10),
        reportService.getCategoryBreakdown(),
      ]);

      setStockSummary(stockRes.summary);
      setLowStock(lowStockRes.lowStockItems);
      setTopSelling(topSellingRes.topSelling);
      setCategoryBreakdown(categoryRes.breakdown);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderStockSummary = () => (
    <View style={styles.reportContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <MaterialCommunityIcons name="package-variant" size={32} color={colors.text} />
            <Text variant="headlineMedium" style={styles.statValue}>
              {stockSummary.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Items
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={[colors.secondary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <MaterialCommunityIcons name="cube-outline" size={32} color={colors.text} />
            <Text variant="headlineMedium" style={styles.statValue}>
              {stockSummary.reduce((sum, item) => sum + item.currentQuantity, 0)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Units
            </Text>
          </LinearGradient>
        </View>
      </View>

      {stockSummary.map((item) => (
        <Card key={item.itemId} style={styles.itemCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.itemHeader}>
              <Text variant="titleMedium" style={styles.itemName}>
                {item.name}
              </Text>
              {item.category && (
                <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
                  {item.category}
                </Chip>
              )}
            </View>
            {item.sku && (
              <Text variant="bodySmall" style={styles.itemSku}>
                SKU: {item.sku}
              </Text>
            )}
            <View style={styles.itemDetails}>
              <View style={styles.detailItem}>
                <Text variant="bodySmall" style={styles.detailLabel}>Current</Text>
                <Text variant="titleMedium" style={styles.detailValue}>
                  {item.currentQuantity} {item.unit}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="bodySmall" style={styles.detailLabel}>Added</Text>
                <Text variant="titleMedium" style={[styles.detailValue, { color: colors.success }]}>
                  +{item.totalAdded}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="bodySmall" style={styles.detailLabel}>Removed</Text>
                <Text variant="titleMedium" style={[styles.detailValue, { color: colors.error }]}>
                  -{item.totalRemoved}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderLowStock = () => (
    <View style={styles.reportContent}>
      <View style={styles.alertBanner}>
        <MaterialCommunityIcons name="alert" size={24} color={colors.warning} />
        <Text variant="titleMedium" style={styles.alertText}>
          {lowStock.length} items need attention
        </Text>
      </View>

      {lowStock.map((item) => (
        <Card key={item.itemId} style={[styles.itemCard, styles.alertCard]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.itemHeader}>
              <Text variant="titleMedium" style={styles.itemName}>
                {item.name}
              </Text>
              <View style={[styles.percentageBadge, { backgroundColor: item.percentageRemaining <= 25 ? colors.error + '20' : colors.warning + '20' }]}>
                <Text style={[styles.percentageText, { color: item.percentageRemaining <= 25 ? colors.error : colors.warning }]}>
                  {item.percentageRemaining}%
                </Text>
              </View>
            </View>
            <View style={styles.stockInfo}>
              <View>
                <Text variant="bodySmall" style={styles.stockLabel}>Current Stock</Text>
                <Text variant="titleLarge" style={[styles.stockValue, { color: colors.error }]}>
                  {item.currentQuantity} {item.unit}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={24} color={colors.textMuted} />
              <View>
                <Text variant="bodySmall" style={styles.stockLabel}>Threshold</Text>
                <Text variant="titleLarge" style={styles.stockValue}>
                  {item.minThreshold} {item.unit}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderTopSelling = () => (
    <View style={styles.reportContent}>
      {topSelling.map((item, index) => (
        <Card key={item.itemId} style={styles.itemCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.rankingRow}>
              <View style={[styles.rankBadge, index < 3 && styles.topRankBadge]}>
                <Text variant="titleLarge" style={styles.rankText}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.rankingInfo}>
                <Text variant="titleMedium" style={styles.itemName}>
                  {item.itemName}
                </Text>
                <View style={styles.sellingStats}>
                  <MaterialCommunityIcons name="trending-up" size={20} color={colors.success} />
                  <Text variant="titleMedium" style={[styles.soldValue, { color: colors.success }]}>
                    {item.totalSold} {item.unit} sold
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderCategoryBreakdown = () => (
    <View style={styles.reportContent}>
      {categoryBreakdown.map((category) => (
        <Card key={category.category} style={styles.itemCard}>
          <LinearGradient
            colors={[colors.surface, colors.surfaceVariant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.categoryCard}
          >
            <View style={styles.categoryHeader}>
              <MaterialCommunityIcons name="tag-multiple" size={28} color={colors.accent} />
              <Text variant="titleLarge" style={styles.categoryName}>
                {category.category}
              </Text>
            </View>
            <View style={styles.categoryStats}>
              <View style={styles.categoryStatItem}>
                <Text variant="bodySmall" style={styles.categoryStatLabel}>Items</Text>
                <Text variant="headlineSmall" style={styles.categoryStatValue}>
                  {category.itemCount}
                </Text>
              </View>
              <View style={styles.categoryStatItem}>
                <Text variant="bodySmall" style={styles.categoryStatLabel}>Total Units</Text>
                <Text variant="headlineSmall" style={styles.categoryStatValue}>
                  {category.totalQuantity}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Card>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Reports
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={reportType}
          onValueChange={(value) => setReportType(value as ReportType)}
          buttons={[
            { value: 'stock-summary', label: 'Stock', icon: 'package-variant' },
            { value: 'low-stock', label: 'Alerts', icon: 'alert' },
            { value: 'top-selling', label: 'Top', icon: 'trending-up' },
            { value: 'category', label: 'Categories', icon: 'tag-multiple' },
          ]}
          style={styles.segmentedButtons}
          theme={{
            colors: {
              secondaryContainer: colors.primary,
              onSecondaryContainer: colors.text,
            },
          }}
        />
      </View>

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
        {reportType === 'stock-summary' && renderStockSummary()}
        {reportType === 'low-stock' && renderLowStock()}
        {reportType === 'top-selling' && renderTopSelling()}
        {reportType === 'category' && renderCategoryBreakdown()}
      </ScrollView>
    </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  reportContent: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
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
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  alertCard: {
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  cardContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: colors.text,
    flex: 1,
  },
  categoryChip: {
    backgroundColor: colors.accent + '20',
    height: 28,
  },
  categoryChipText: {
    color: colors.accent,
    fontSize: 11,
  },
  itemSku: {
    color: colors.textMuted,
    marginBottom: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  alertText: {
    color: colors.text,
    flex: 1,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  stockLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  stockValue: {
    color: colors.text,
    fontWeight: '600',
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankBadge: {
    backgroundColor: colors.primary + '40',
  },
  rankText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  rankingInfo: {
    flex: 1,
  },
  sellingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  soldValue: {
    fontWeight: '600',
  },
  categoryCard: {
    padding: 20,
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoryName: {
    color: colors.text,
    fontWeight: 'bold',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  categoryStatItem: {
    alignItems: 'center',
  },
  categoryStatLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  categoryStatValue: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
