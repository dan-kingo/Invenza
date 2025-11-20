import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import itemService from '../../services/item.service';

export default function ScanScreen() {
  const router = useRouter();
  const [tagId, setTagId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);

  const handleScan = async () => {
    if (!tagId.trim()) {
      Alert.alert('Error', 'Please enter a tag ID');
      return;
    }

    setScanning(true);
    setScannedItem(null);

    try {
      const result = await itemService.scanItem(tagId.trim());

      if (result.item) {
        setScannedItem(result.item);
        Alert.alert('Success', 'Item found!', [
          {
            text: 'View Details',
            onPress: () => router.push(`/stock/item-detail?id=${result.item._id}`),
          },
          { text: 'OK', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Info', result.message || 'Tag found but not attached to any item');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to scan tag');
    } finally {
      setScanning(false);
    }
  };

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
      >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Scan Item
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter or scan a tag ID to view item details
          </Text>
        </View>

        <View style={styles.scanContainer}>
          <Card style={styles.scanCard}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanGradient}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={80} color={colors.text} />
            </LinearGradient>
          </Card>

          <TextInput
            label="Tag ID"
            value={tagId}
            onChangeText={setTagId}
            mode="outlined"
            placeholder="Enter tag ID..."
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.text}
            placeholderTextColor={colors.textMuted}
            left={<TextInput.Icon icon="tag" color={colors.primary} />}
            theme={{
              colors: {
                onSurfaceVariant: colors.textMuted,
              },
            }}
          />

          <Button
            mode="contained"
            onPress={handleScan}
            loading={scanning}
            disabled={scanning || !tagId.trim()}
            style={styles.scanButton}
            labelStyle={styles.scanButtonLabel}
            contentStyle={styles.buttonContent}
            icon={() => <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />}
          >
            Scan Tag
          </Button>
        </View>

        {scannedItem && (
          <Card style={styles.resultCard}>
            <Card.Content style={styles.resultContent}>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons name="check-circle" size={32} color={colors.success} />
                <Text variant="titleLarge" style={styles.resultTitle}>
                  Item Found
                </Text>
              </View>

              <View style={styles.resultDetails}>
                <Text variant="headlineSmall" style={styles.itemName}>
                  {scannedItem.name}
                </Text>
                {scannedItem.sku && (
                  <Text variant="bodyMedium" style={styles.itemInfo}>
                    SKU: {scannedItem.sku}
                  </Text>
                )}
                <View style={styles.quantityRow}>
                  <Text variant="bodyMedium" style={styles.itemInfo}>
                    Quantity:
                  </Text>
                  <Text variant="titleMedium" style={styles.itemQuantity}>
                    {scannedItem.quantity} {scannedItem.unit}
                  </Text>
                </View>
                {scannedItem.category && (
                  <Text variant="bodyMedium" style={styles.itemInfo}>
                    Category: {scannedItem.category}
                  </Text>
                )}
              </View>

              <Button
                mode="contained"
                onPress={() => router.push(`/stock/item-detail?id=${scannedItem._id}`)}
                style={styles.viewButton}
                labelStyle={styles.viewButtonLabel}
              >
                View Full Details
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.infoSection}>
          <Text variant="titleMedium" style={styles.infoTitle}>
            How to use
          </Text>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="numeric-1-circle" size={24} color={colors.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>
              Enter or scan a tag ID
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="numeric-2-circle" size={24} color={colors.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>
              Tap Scan Tag to search
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="numeric-3-circle" size={24} color={colors.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>
              View item details and manage inventory
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  scanContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scanCard: {
    width: 200,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  scanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    width: '100%',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: '100%',
  },
  scanButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: colors.success + '60',
  },
  resultContent: {
    padding: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  resultTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  resultDetails: {
    gap: 8,
    marginBottom: 16,
  },
  itemName: {
    color: colors.text,
    fontWeight: 'bold',
  },
  itemInfo: {
    color: colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQuantity: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  viewButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  infoTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: colors.textSecondary,
    flex: 1,
  },
});
