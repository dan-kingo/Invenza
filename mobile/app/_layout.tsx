import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme/theme';

export default function RootLayout() {
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
