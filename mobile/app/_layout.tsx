import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import * as SystemUI from "expo-system-ui";
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme/theme';
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Set Android system navigation bar color
    SystemUI.setBackgroundColorAsync('#0E1B18'); // dark green / theme color
  }, []);
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </AuthProvider>
    </PaperProvider>
  );
}
