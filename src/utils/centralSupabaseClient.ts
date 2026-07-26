import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ShopRegistration } from '../types';

let centralClient: SupabaseClient | null = null;

export function getCentralSupabaseClient(): SupabaseClient | null {
  if (centralClient) return centralClient;

  const meta = import.meta as any;
  const url = meta.env?.VITE_CENTRAL_SUPABASE_URL;
  const key = meta.env?.VITE_CENTRAL_SUPABASE_ANON_KEY;

  if (url && key) {
    centralClient = createClient(url, key);
    return centralClient;
  }

  return null;
}

export async function pushShopToCentralSupabase(shop: ShopRegistration): Promise<boolean> {
  const client = getCentralSupabaseClient();
  if (!client) {
    console.warn("Central Supabase is not configured. Skipping sync.");
    return false;
  }

  try {
    const { error } = await client
      .from('vastraa_central_shops')
      .upsert({
        id: shop.id,
        shop_name: shop.shopName,
        owner_name: shop.ownerName,
        mobile: shop.mobile,
        status: shop.subscription.status,
        data: shop,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Failed to push shop to central Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception pushing shop to central Supabase:", err);
    return false;
  }
}

export async function pullShopsFromCentralSupabase(): Promise<ShopRegistration[] | null> {
  const client = getCentralSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('vastraa_central_shops')
      .select('data');

    if (error) {
      console.error("Failed to pull shops from central Supabase:", error);
      return null;
    }

    if (data) {
      return data.map((row: any) => row.data as ShopRegistration);
    }
    return [];
  } catch (err) {
    console.error("Exception pulling shops from central Supabase:", err);
    return null;
  }
}

export const CENTRAL_SUPABASE_SETUP_SQL = `-- Paste this SQL script into your Central Supabase SQL Editor (https://supabase.com)
-- This creates the table for storing shop registrations centrally.

create table if not exists vastraa_central_shops (
  id text primary key,
  shop_name text not null,
  owner_name text not null,
  mobile text not null,
  status text not null,
  data jsonb not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Realtime for this table
alter publication supabase_realtime add table vastraa_central_shops;
`;
