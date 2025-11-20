import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import itemService, { Item } from '../../services/item.service';

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'pcs' | 'kg' | 'ltr'>('pcs');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState('');

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await itemService.getItem(id as string);
      setName(data.name);
      setSku(data.sku || '');
      setDescription(data.description || '');
      setUnit(data.unit);
      setCategory(data.category || '');
      setLocation(data.location || '');
      setMinThreshold(data.minThreshold?.toString() || '');
    } catch (error) {
      console.error('Failed to load item:', error);
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    setSaving(true);
    try {
      await itemService.updateItem(id as string, {
        name,
        sku: sku || undefined,
        description: description || undefined,
        unit,
        category: category || undefined,
        location: location || undefined,
        minThreshold: minThreshold ? parseInt(minThreshold) : undefined,
      });

      Alert.alert('Success', 'Item updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update item');
    } finally {
      setSaving(false);
    }
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => router.back()}
            textColor={colors.secondary}
            icon={() => <MaterialCommunityIcons name="arrow-left" size={20} color={colors.secondary} />}
          >
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Edit Item
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <TextInput
              label="Item Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
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

            <TextInput
              label="SKU"
              value={sku}
              onChangeText={setSku}
              mode="outlined"
              style={styles.input}
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

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
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

            <View style={styles.unitContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Unit
              </Text>
              <SegmentedButtons
                value={unit}
                onValueChange={(value) => setUnit(value as 'pcs' | 'kg' | 'ltr')}
                buttons={[
                  { value: 'pcs', label: 'Pieces' },
                  { value: 'kg', label: 'KG' },
                  { value: 'ltr', label: 'Liter' },
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

            <TextInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              mode="outlined"
              style={styles.input}
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

            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
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

            <TextInput
              label="Minimum Threshold"
              value={minThreshold}
              onChangeText={setMinThreshold}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
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

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
  },
  unitContainer: {
    marginVertical: 8,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
});
