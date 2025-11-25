import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  FAB,
  Portal,
  Dialog,
  SegmentedButtons,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { colors } from '../../theme/colors';
import itemService from '../../services/item.service';
import tagService, { Tag } from '../../services/tag.service';

export default function ScanScreen() {
  const router = useRouter();
  const [tagId, setTagId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registerDialogVisible, setRegisterDialogVisible] = useState(false);
  const [newTagId, setNewTagId] = useState('');
  const [newTagType, setNewTagType] = useState<'item' | 'box'>('item');
  const [registering, setRegistering] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'item' | 'box'>('all');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scanningQR, setScanningQR] = useState(false);

  useEffect(() => {
    loadTags();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const loadTags = async () => {
    try {
      const data = await tagService.listTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTags();
    setRefreshing(false);
  };

  const handleRegisterTag = async () => {
    if (!newTagId.trim()) {
      Alert.alert('Error', 'Please enter a tag ID');
      return;
    }

    setRegistering(true);
    try {
      await tagService.registerTag({
        tagId: newTagId.trim(),
        type: newTagType,
      });

      Alert.alert('Success', 'Tag registered successfully');
      setRegisterDialogVisible(false);
      setNewTagId('');
      setNewTagType('item');
      loadTags();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to register tag');
    } finally {
      setRegistering(false);
    }
  };

  const handleScan = async (incomingTagId?: string) => {
    const id = (incomingTagId || tagId).trim();

    if (!id) {
      Alert.alert('Error', 'Please enter a tag ID');
      return;
    }

    setScanning(true);
    setScannedItem(null);

    try {
      const result = await itemService.scanItem(id);

      if (result.item) {
        setScannedItem(result.item);

        Alert.alert(
          'Item Found',
          `Tag: ${result.tagId}`,
          [
            {
              text: 'View Item',
              onPress: () => router.push(`/stock/item-detail?id=${result.item._id}`),
            },
          
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert('Tag Found', 'But no item attached yet');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to scan tag');
    } finally {
      setScanning(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanningQR(false);
    handleScan(data);
  };

  const filteredTags = tags.filter((tag) => {
    if (filterType === 'all') return true;
    return tag.type === filterType;
  });

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
          <Text variant="headlineLarge" style={styles.title}>
            Scan Item
          </Text>
  
        </View>

        <View style={styles.scanContainer}>
         

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
            onPress={() => handleScan()}
            loading={scanning}
            disabled={scanning || !tagId.trim()}
            style={styles.scanButton}
            labelStyle={styles.scanButtonLabel}
            contentStyle={styles.buttonContent}
            icon={() => <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />}
          >
            Scan Tag
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              if (!cameraPermission) {
                Alert.alert('Camera permission denied', 'Please enable camera access in settings.');
                return;
              }
              setScanningQR(true);
            }}
            style={[styles.scanButton, { marginTop: 12 }]}
          >
            Scan QR/Barcode
          </Button>
        </View>

        {/* Scanned item card */}
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

        {/* Registered tags */}
        <View style={styles.tagsSection}>
          <View style={styles.tagsSectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Registered Tags
            </Text>
            <SegmentedButtons
              value={filterType}
              onValueChange={(value) => setFilterType(value as 'all' | 'item' | 'box')}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'item', label: 'Item' },
                { value: 'box', label: 'Box' },
              ]}
              style={styles.filterButtons}
              theme={{
                colors: {
                  secondaryContainer: colors.primary,
                  onSecondaryContainer: colors.text,
                },
              }}
            />
          </View>

          {loadingTags ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredTags.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="tag-off" size={48} color={colors.textMuted} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No Tags Found
                </Text>
                <Text variant="bodyMedium" style={styles.emptyMessage}>
                  {filterType === 'all'
                    ? 'Register your first tag to get started'
                    : `No ${filterType} tags registered yet`}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.tagsGrid}>
              {filteredTags.map((tag) => (
                <Card key={tag._id} style={styles.tagCard}>
                  <TouchableOpacity
                    onPress={() => {
                      setTagId(tag.tagId);
                      handleScan(tag.tagId);
                    }}
                  >
                    <Card.Content style={styles.tagCardContent}>
                      <View style={styles.tagCardHeader}>
                        <MaterialCommunityIcons
                          name={tag.type === 'item' ? 'tag' : 'package-variant'}
                          size={24}
                          color={colors.primary}
                        />
                        <Chip
                          style={[
                            styles.tagTypeChip,
                            tag.type === 'item' ? styles.itemTypeChip : styles.boxTypeChip,
                          ]}
                          textStyle={styles.tagTypeChipText}
                        >
                          {tag.type}
                        </Chip>
                      </View>
                      <Text variant="bodyLarge" style={styles.tagIdText} numberOfLines={1}>
                        {tag.tagId}
                      </Text>
                      {tag.attachedItemId && (
                        <View style={styles.attachedIndicator}>
                          <MaterialCommunityIcons
                            name="link-variant"
                            size={16}
                            color={colors.success}
                          />
                          <Text variant="bodySmall" style={styles.attachedText}>
                            Attached to item
                          </Text>
                        </View>
                      )}
                    </Card.Content>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* <FAB
        icon="plus"
        style={styles.fab}
        color={colors.text}
        onPress={() => setRegisterDialogVisible(true)}
        label="Register Tag"
      /> */}

      {/* Register Tag Dialog */}
      {/* <Portal>
        <Dialog
          visible={registerDialogVisible}
          onDismiss={() => setRegisterDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Register New Tag</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Tag ID (Optional)"
              value={newTagId}
              onChangeText={setNewTagId}
              mode="outlined"
              placeholder="Leave empty to auto-generate"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <View style={styles.typeContainer}>
              <Text variant="bodyMedium" style={styles.typeLabel}>
                Tag Type
              </Text>
              <SegmentedButtons
                value={newTagType}
                onValueChange={(value) => setNewTagType(value as 'item' | 'box')}
                buttons={[
                  { value: 'item', label: 'Item', icon: 'tag' },
                  { value: 'box', label: 'Box', icon: 'package-variant' },
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setRegisterDialogVisible(false)}
              textColor={colors.textSecondary}
              disabled={registering}
            >
              Cancel
            </Button>
            <Button
              onPress={handleRegisterTag}
              textColor={colors.primary}
              loading={registering}
              disabled={registering}
            >
              Register
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal> */}

      {/* Camera QR Scanner */}
      <Modal visible={scanningQR} animationType="slide">
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'code128',
                'ean13',
                'ean8',
              ],
            }}
          />
          <Button
            mode="contained"
            style={{ position: 'absolute', bottom: 40, alignSelf: 'center', width: 200 }}
            onPress={() => setScanningQR(false)}
          >
            Close
          </Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 100, paddingHorizontal: 24 },
  header: { alignItems: 'flex-start', marginBottom: 12 },
  title: { color: colors.text, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: colors.textSecondary, textAlign: 'center' },
  scanContainer: { alignItems: 'center', marginBottom: 32 },
  scanCard: { width: 200, height: 200, borderRadius: 24, overflow: 'hidden', marginBottom: 24 },
  scanGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: colors.surface, width: '100%', marginBottom: 16 },
  scanButton: { backgroundColor: colors.primary, borderRadius: 12, width: '100%' },
  scanButtonLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  buttonContent: { height: 56 },
  resultCard: { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 32, borderWidth: 2, borderColor: colors.success + '60' },
  resultContent: { padding: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultTitle: { color: colors.text, fontWeight: 'bold', marginLeft: 12 },
  resultDetails: { marginTop: 8, marginBottom: 16 },
  itemName: { color: colors.text, fontWeight: 'bold' },
  itemInfo: { color: colors.textSecondary },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemQuantity: { color: colors.secondary, fontWeight: 'bold' },
  viewButton: { backgroundColor: colors.secondary, borderRadius: 12 },
  viewButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  tagsSection: { marginTop: 8, paddingHorizontal: 0, marginBottom: 24 },
  tagsSectionHeader: { flexDirection: 'column', gap:12, alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontWeight: '600' },
  filterButtons: { minWidth: 160 },
  loadingContainer: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 12, marginHorizontal: 0, marginBottom: 12 },
  emptyContent: { alignItems: 'center', padding: 24 },
  emptyTitle: { color: colors.text, marginTop: 8, fontWeight: '600' },
  emptyMessage: { color: colors.textSecondary, marginTop: 4 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 0 },
  tagCard: { width: '100%', borderRadius: 12, marginBottom: 12, height:120 },
  tagCardContent: { padding: 12 },
  tagCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagTypeChip: { height: 34 },
  itemTypeChip: { backgroundColor: colors.primary + '20' },
  boxTypeChip: { backgroundColor: colors.secondary + '20' },
  tagTypeChipText: { color: colors.text, fontSize: 16, textTransform: 'capitalize' },
  tagIdText: { color: colors.text, marginTop: 8, fontWeight: '500' },
  attachedIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  attachedText: { color: colors.success, marginLeft: 4, fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
  dialog: { borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,1.1)' },
  dialogTitle: { color: colors.text, fontWeight: '600' },
  dialogContent: { paddingTop: 0 },
  dialogInput: { backgroundColor: colors.surface, marginBottom: 16 },
  typeContainer: { marginBottom: 8 },
  typeLabel: { color: colors.textSecondary, marginBottom: 8 },
  segmentedButtons: {},
});