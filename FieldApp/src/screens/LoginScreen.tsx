// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// // 👇 Define the type for your navigation stack
// type RootStackParamList = {
//   Login: undefined;
//   Home: undefined;
// };

// type LoginScreenNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   "Login"
// >;

// interface Props {
//   navigation: LoginScreenNavigationProp;
// }

// const BASE_URL = "https://d1b00c5883ea.ngrok-free.app/api";

// const LoginScreen: React.FC<Props> = ({ navigation }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!username || !password) {
//       Alert.alert("Error", "Please enter both username and password.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${BASE_URL}/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//       });

//       const data = await response.json().catch(() => null);

//       if (response.ok) {
//         Alert.alert("✅ Success", `Welcome ${data.first_name || data.username}!`);
//         navigation.navigate("Home");
//       } else if (response.status === 401) {
//         Alert.alert("❌ Invalid", "Invalid username or password.");
//       } else {
//         Alert.alert("⚠️ Error", data?.detail || "Something went wrong.");
//       }
//     } catch (error) {
//       console.error("🚨 Login error:", error);
//       Alert.alert("Network Error", "Unable to connect to server.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Admin Login</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Username"
//         value={username}
//         onChangeText={setUsername}
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <TouchableOpacity
//         style={[styles.button, loading && { backgroundColor: "#ccc" }]}
//         onPress={handleLogin}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? "Logging in..." : "Login"}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
//   input: {
//     width: "100%",
//     padding: 10,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 5,
//     marginBottom: 15,
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     padding: 12,
//     borderRadius: 5,
//     width: "100%",
//   },
//   buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
// });

// export default LoginScreen;
// // /src/screens/LoginScreen.tsx
// import React, { useState } from 'react';
// import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
// import apiClient from '../api/apiClient';
// import { useAuth } from '../context/AuthContext';
// import { User } from '../types';

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const { login } = useAuth();

//   const handleLogin = async () => {
//     try {
//       const response = await apiClient.post<User>('/api/auth/login', { username, password });
//       if (response.data?.id) {
//         login(response.data); // Log in any user with a valid response
//       } else {
//         Alert.alert('Login Failed', 'Received an invalid user object.');
//       }
//     } catch (error: any) {
//       Alert.alert('Login Failed', error.response?.data?.detail || 'An unknown error occurred.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Mluis Payroll</Text>
//       <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
//       <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
//       <Button title="Login" onPress={handleLogin} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
//   title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
//   input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff' },
// });

// export default LoginScreen;








/// /src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

// --- Constants for a beautiful, elegant style guide ---
const COLORS = {
  primary: '#5C6BC0', // Rich Indigo Blue for actions
  primaryDark: '#3F51B5',
  headingText: '#3949AB', // Deep Charcoal/Slate Gray for headings
  bodyText: '#757575',    // Medium Gray for body/secondary text
  background: '#E8EAF6',
  card: '#FFFFFF',
  shadow: '#000000',
};

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (isLoading) return;

    // Basic validation
    if (!username || !password) {
      Alert.alert('Hold On', 'Please enter both username and password to log in.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<User>('/api/auth/login', { username, password });
      
      if (response.data?.id) {
        login(response.data);
      } else {
        Alert.alert('Login Failed', 'Received an invalid user object.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Could not connect to the server. Check your connection.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* REVISED HEADER/BRANDING AREA */}
        <View style={styles.header}>
            {/* Main Title: Bolder, cleaner font weight, soft color */}
            <Text style={styles.mainTitle}>Mluis Payroll System</Text>
            
            {/* Subtitle: Lighter font weight, gentle color */}
            <Text style={styles.welcomeText}>Welcome back, sign in to your account.</Text>
        </View>

        {/* Input Card Area (No Change Needed Here) */}
        <View style={styles.card}>
            <TextInput
              style={[
                styles.input,
                isUsernameFocused && styles.inputFocused
              ]}
              placeholder="Username"
              placeholderTextColor={COLORS.bodyText}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isLoading}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
            />
            <TextInput
              style={[
                styles.input,
                isPasswordFocused && styles.inputFocused
              ]}
              placeholder="Password"
              placeholderTextColor={COLORS.bodyText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              editable={!isLoading}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              onSubmitEditing={handleLogin}
            />

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.card} size="small" />
              ) : (
                <Text style={styles.buttonText}>Log In Securely</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.linkContainer}>
               <Text style={styles.linkText}>Trouble logging in? Reset Password</Text>
            </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

// --- Beautiful and Elegant Styles (Header Updated) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  // --- Header Styles ---
  header: {
    marginBottom: 50,
    alignItems: 'center',
  },
  // --- REVISED MAIN TITLE STYLE ---
  mainTitle: {
    fontSize: 32,
    fontWeight: '700', // Bolder but not excessively so
    color: COLORS.headingText, // Clean, dark color
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  // --- REVISED WELCOME TEXT STYLE ---
  welcomeText: {
    fontSize: 16,
    fontWeight: '400', // Regular weight for elegance
    color: COLORS.bodyText, // Softer gray
    textAlign: 'center',
  },
  
  // --- Card/Form Styles ---
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 25,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  input: {
    height: 55,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.headingText,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
    ...Platform.select({
      ios: { shadowOpacity: 0.1, shadowRadius: 5 },
      android: { elevation: 5 },
    }),
  },
  // --- Button Styles ---
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: `${COLORS.primary}80`,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: '700',
  },
  // --- Link Styles ---
  linkContainer: {
    alignSelf: 'center',
    marginTop: 25,
    padding: 5,
  },
  linkText: {
    color: COLORS.bodyText,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;