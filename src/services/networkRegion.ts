import { registerPlugin } from '@capacitor/core';

export interface NetworkCountryResult {
  // ISO 3166-1 alpha-2 country of the network the phone is currently
  // registered to. Empty string if not registered (airplane mode, WiFi-only
  // device with no cellular radio).
  networkCountryIso: string;
  // ISO 3166-1 alpha-2 country the SIM itself was issued in. Stays fixed
  // while roaming, so it's a good fallback when networkCountryIso is empty.
  simCountryIso: string;
  isRoaming: boolean;
}

export interface NetworkRegionPlugin {
  getNetworkCountry(): Promise<NetworkCountryResult>;
}

export const NetworkRegion = registerPlugin<NetworkRegionPlugin>('NetworkRegion');
