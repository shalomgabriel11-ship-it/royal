/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://peknslhedvvenfzmlrjm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla25zbGhlZHZ2ZW5mem1scmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzY1MDEsImV4cCI6MjEwNTExMjUwMX0.kQ9t6jFrexKixqFIXOwwQ1VXcxBRGTcYpx-G2p7ZYNc';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getRoomImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  const { data } = supabase.storage.from('room-images').getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

export function getGalleryImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  const { data } = supabase.storage.from('gallery-images').getPublicUrl(storagePath);
  return data?.publicUrl || null;
}
