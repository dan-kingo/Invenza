import React from "react";
import { View, StyleSheet, Image, Alert } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StatusBar } from "expo-status-bar";

// ⚡ Fix TS typing issues for documentDirectory & EncodingType
const DOCUMENT_DIR = (FileSystem as any).documentDirectory as string;
const ENCODING_BASE64 = (FileSystem as any).EncodingType?.Base64 || "base64";

export default function PrintQrScreen() {
  const router = useRouter();
  const { tag, qr } = useLocalSearchParams<{ tag: string; qr: string }>();

  const handleDownload = async () => {
    try {
      const base64 = qr.replace("data:image/png;base64,", "");
      const fileUri = DOCUMENT_DIR + `${tag}.png`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: ENCODING_BASE64,
      });

      Alert.alert("Saved", "QR Code saved to device.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to download QR code");
    }
  };

  const handleShare = async () => {
    try {
      const base64 = qr.replace("data:image/png;base64,", "");
      const fileUri = DOCUMENT_DIR + `${tag}.png`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: ENCODING_BASE64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to share QR code");
    }
  };

  const handlePrint = async () => {
    try {
      await Print.printAsync({
        html: `
          <html>
            <body style="display:flex;flex-direction:column;align-items:center;margin-top:40px;font-family:sans-serif;">
              <h2>Tag ID: ${tag}</h2>
              <img src="${qr}" style="width:300px;height:300px;"/>
            </body>
          </html>
        `,
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to print QR code");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={colors.secondary}
          icon={() => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={colors.secondary}
            />
          )}
        >
          Back
        </Button>

        <Text variant="headlineSmall" style={styles.headerTitle}>
          QR Code
        </Text>

        <View style={{ width: 60 }} />
      </View>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleLarge" style={styles.tagText}>
            Tag: {tag}
          </Text>

          <Image
            source={{ uri: qr }}
            style={styles.qrImage}
            resizeMode="contain"
          />

          <View style={styles.btnGroup}>
            <Button
              mode="contained"
              onPress={handleDownload}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Download
            </Button>

            <Button
              mode="contained"
              onPress={handleShare}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Share
            </Button>

            <Button
              mode="contained"
              onPress={handlePrint}
              style={[styles.button, { backgroundColor: colors.secondary }]}
              labelStyle={styles.buttonLabel}
            >
              Print
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: "bold",
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingVertical: 20,
  },
  cardContent: {
    alignItems: "center",
    gap: 20,
  },
  tagText: {
    color: colors.text,
    fontWeight: "600",
  },
  qrImage: {
    width: 250,
    height: 250,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
  },
  btnGroup: {
    width: "100%",
    marginTop: 10,
    gap: 10,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  buttonLabel: {
    color: colors.text,
    fontWeight: "600",
  },
});
