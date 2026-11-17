import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

/** Archivo elegido por el usuario, listo para subir. */
export type PickedFile = { uri: string; name: string; mimeType: string; size?: number };

export type Bucket = 'payment-receipts' | 'lease-documents' | 'property-photos';

const MAX_BYTES: Record<Bucket, number> = {
  'payment-receipts': 10 * 1024 * 1024,
  'lease-documents': 15 * 1024 * 1024,
  'property-photos': 5 * 1024 * 1024,
};

/** Foto de la galería, comprimida (TAD §8.6). Devuelve null si el usuario cancela. */
export async function pickImage(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('PHOTOS_PERMISSION_DENIED');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `foto-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize,
  };
}

/** Foto con la cámara. */
export async function takePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('CAMERA_PERMISSION_DENIED');
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `foto-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize,
  };
}

/** PDF o imagen desde los archivos del teléfono. */
export async function pickDocument(types: string[] = ['application/pdf', 'image/*']): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream', size: asset.size };
}

function extensionFor(file: PickedFile): string {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(file.name)?.[1];
  if (fromName) return fromName.toLowerCase();
  if (file.mimeType === 'application/pdf') return 'pdf';
  if (file.mimeType === 'image/png') return 'png';
  if (file.mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Sube un archivo a un bucket privado dentro de `folder` y devuelve su ruta. */
export async function uploadFile(bucket: Bucket, folder: string, file: PickedFile): Promise<string> {
  if (file.size && file.size > MAX_BYTES[bucket]) throw new Error('FILE_TOO_LARGE');
  const path = `${folder}/${randomId()}.${extensionFor(file)}`;
  const bytes = await new File(file.uri).arrayBuffer();
  if (bytes.byteLength > MAX_BYTES[bucket]) throw new Error('FILE_TOO_LARGE');
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: file.mimeType, upsert: false });
  if (error) throw error;
  return path;
}

/** URL firmada de vida corta para ver un archivo privado (5 minutos por defecto). */
export async function signedUrl(bucket: Bucket, path: string, seconds = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export function isImagePath(path: string): boolean {
  return /\.(jpe?g|png|webp|heic)$/i.test(path);
}
