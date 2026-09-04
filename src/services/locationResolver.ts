import { registerPlugin } from '@capacitor/core';

export interface LocationReadyResult {
  granted: boolean;
  gpsEnabled: boolean;
}

export interface LocationResolverPlugin {
  // Requests fine/coarse location permission, then checks whether the
  // device's location setting satisfies high-accuracy tracking -- showing
  // Android's native one-tap "Turn on GPS" dialog if it doesn't.
  ensureLocationReady(): Promise<LocationReadyResult>;
}

export const LocationResolver = registerPlugin<LocationResolverPlugin>('LocationResolver');
