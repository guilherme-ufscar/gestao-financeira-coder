import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

const SERVER_ID = 'com.codermaster.cofrin';

export async function isBiometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function getBiometryType(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return 'none';
  try {
    const result = await NativeBiometric.isAvailable();
    if (result.biometryType === BiometryType.FINGERPRINT) return 'fingerprint';
    if (result.biometryType === BiometryType.FACE_AUTHENTICATION) return 'face';
    if (result.biometryType === BiometryType.IRIS_AUTHENTICATION) return 'iris';
    return 'biometric';
  } catch {
    return 'none';
  }
}

export async function saveCredentials(email: string, refreshToken: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await NativeBiometric.setCredentials({
      username: email,
      password: refreshToken,
      server: SERVER_ID,
    });
    return true;
  } catch {
    return false;
  }
}

export async function getCredentials(): Promise<{ email: string; refreshToken: string } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    await NativeBiometric.verifyIdentity({
      reason: 'Autentique-se para acessar o Cofrin',
      title: 'Login Cofrin',
      subtitle: 'Use sua digital para entrar',
      description: '',
    });
    const credentials = await NativeBiometric.getCredentials({ server: SERVER_ID });
    return {
      email: credentials.username,
      refreshToken: credentials.password,
    };
  } catch {
    return null;
  }
}

export async function deleteCredentials(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeBiometric.deleteCredentials({ server: SERVER_ID });
  } catch {
    // ignore
  }
}