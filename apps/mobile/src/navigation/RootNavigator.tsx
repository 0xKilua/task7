import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../lib/auth-context";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { StudioScreen } from "../screens/StudioScreen";
import { GalleryScreen } from "../screens/GalleryScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Studio: { photoId: string };
  Gallery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: "#b32c64" }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Relook" }} />
            <Stack.Screen name="Studio" component={StudioScreen} options={{ title: "Simulation" }} />
            <Stack.Screen name="Gallery" component={GalleryScreen} options={{ title: "Ma galerie" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Connexion" }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Creer un compte" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
