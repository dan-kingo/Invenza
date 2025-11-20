import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import * as SystemUI from "expo-system-ui";
import * as Linking from 'expo-linking';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme/theme';
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

function RootNavigator() {
  const router = useRouter();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#1E293B');
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path, queryParams } = Linking.parse(url);

      if (path === 'verify-email' && queryParams?.token) {
        router.push(`/auth/verify-email?token=${queryParams.token}`);
      } else if (path === 'reset-password' && queryParams?.token) {
        router.push(`/auth/reset-password?token=${queryParams.token}`);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
       <StatusBar style="light" backgroundColor="#000" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
