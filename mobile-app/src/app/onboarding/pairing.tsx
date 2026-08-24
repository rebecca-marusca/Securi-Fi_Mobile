import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { apiFetch } from '@/services/api';

export default function PairingScreen() {
  const router = useRouter();
  const [macAddress, setMacAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePair = async () => {
    if (!macAddress.trim()) {
      setError('Enter a MAC address to continue');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      const response = await apiFetch('/homes/pair', {
        method: 'POST',
        body: JSON.stringify({ master_mac: macAddress.trim() }),
      });

      if (response.ok) {
        router.replace('/tabs/home');
        return;
      }

      const data = await response.json();
      if (response.status === 404) {
        setError('No device found with that MAC address. Make sure it\u2019s powered on.');
      } else if (response.status === 409) {
        setError('You\u2019re already paired with this home.');
      } else {
        setError(data.detail ?? 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.log('Pairing error:', err);
      setError('Could not reach the server. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter your device's MAC address</Text>
      <TextInput
        style={styles.input}
        value={macAddress}
        onChangeText={setMacAddress}
        autoCapitalize="characters"
        placeholder="AA:BB:CC:DD:EE:FF"
        placeholderTextColor={colors.textMuted}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.spacer} />

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handlePair}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Pairing…' : 'Pair device'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  label: { fontFamily: 'SF-Pro-Text-Bold', fontSize: 17, color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.bgSecondary2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontFamily: 'SF-Pro-Text-Medium',
    fontSize: 15,
    color: colors.textMuted,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  errorText: { fontFamily: 'SF-Pro-Text-Regular', fontSize: 13, color: '#B3453D', marginTop: 12 },
  spacer: { flex: 1 },
  button: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginHorizontal: 15, marginTop: 30 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontFamily: 'SF-Pro-Text-Semibold', fontSize: 16, color: colors.base },
});