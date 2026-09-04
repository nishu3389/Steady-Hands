// Multi-Modal Mindful Walking & Sensor Fusion Engine
// Detects gentle bipedal walking motion even when the user is holding the phone
// flat and steady to balance the water bowl, using:
// 1. 3D Gravity Vector Tracking & Earth-Axis Vertical Bounce Projection
// 2. Bandpass-Filtered Walking Cadence Isolation (0.7 Hz - 2.8 Hz)
//    which mathematically filters out 8-12 Hz hand tremor & <0.3 Hz postural sway
// 3. Peak-to-Valley Oscillatory Step State Machine
// 4. Personalized Resting Tremor Calibration during the 3-second bowl hold
// 5. Cadence-Driven Walking State with timeout (~2.0s without steps -> PAUSED)
// 6. High-Accuracy GPS Geolocation Velocity Fusion

import { DistanceUnit, GpsStatus, WalkingSensitivity } from '../types';

export interface WalkingState {
  isWalking: boolean;
  steps: number;
  distanceMeters: number;
  distanceFeet: number;
  currentCadenceStepsPerMin: number;
  motionEnergy: number; // 0.0 to 1.0 normalized activity intensity
  lastMotionMagnitude: number;
  gpsStatus: GpsStatus;
  gpsSpeedMps: number;
  sensorActive: boolean;
  source: 'sensor' | 'gps' | 'fusion' | 'simulated';
}

// Biomechanical constants for mindful steady walking (e.g. Kinhin meditation)
// Indoors / slow deliberate steps are typically ~0.55 meters (1.80 feet)
export const STRIDE_LENGTH_METERS = 0.55;
export const STRIDE_LENGTH_FEET = 1.804;

// Threshold presets based on sensitivity
interface SensitivityConfig {
  stepPeakThresh: number; // Minimum positive bounce peak (m/s^2)
  stepValleyThresh: number; // Minimum negative bounce dip (m/s^2)
  stepP2pThresh: number; // Minimum peak-to-valley swing (m/s^2)
  stepTimeoutMs: number; // Window after last step before declaring PAUSED (ms)
}

const SENSITIVITY_CONFIGS: Record<WalkingSensitivity, SensitivityConfig> = {
  // Steady Hands (Recommended for Balancing):
  // Tuned for deliberate, slow footsteps (~30-60 steps/min).
  // Easily exceeds the 0.08 m/s^2 walking bounce while completely ignoring
  // hand tremors (<0.03 m/s^2 after bandpass filter).
  high: {
    stepPeakThresh: 0.085,
    stepValleyThresh: -0.045,
    stepP2pThresh: 0.13,
    stepTimeoutMs: 2100,
  },
  // Standard everyday walking
  medium: {
    stepPeakThresh: 0.15,
    stepValleyThresh: -0.08,
    stepP2pThresh: 0.23,
    stepTimeoutMs: 1800,
  },
  // Active / brisk stride
  low: {
    stepPeakThresh: 0.24,
    stepValleyThresh: -0.13,
    stepP2pThresh: 0.37,
    stepTimeoutMs: 1500,
  },
};

// Refractory period: prevents double-counting on a single heel strike (max ~175 steps/min)
const MIN_STEP_INTERVAL_MS = 340;
// Maximum expected interval between consecutive steps
const MAX_STEP_INTERVAL_MS = 2400;

export class WalkingDetector {
  private isRunning = false;
  private isWalking = false;
  private steps = 0;
  private lastStepTimestamp = 0;
  private recentStepTimes: number[] = [];
  private sensitivity: WalkingSensitivity = 'high';
  private gpsEnabled = true;

  // 3D Gravity and Dynamic Motion Vector Tracking
  private gravX = 0;
  private gravY = 0;
  private gravZ = 9.80665;
  private isGravityInitialized = false;

  // Digital Bandpass Filter State (0.7 Hz to 2.8 Hz cadence isolation)
  // Isolates vertical bipedal footfalls while rejecting 8-12 Hz physiological hand tremor
  private lastVertBounce = 0;
  private vertHp = 0; // High-pass: DC & slow posture tilt rejection (<0.6 Hz)
  private vertBp = 0; // Low-pass: Tremor rejection (>2.8 Hz)
  private vertSmoothed = 0; // Secondary smoothing for clean zero-crossings

  // Step detection state machine
  private isStepArmed = false;
  private stepPeakValue = 0;
  private currentMotionEnergy = 0;
  private currentFilteredMag = 0;

  // Personalized resting tremor noise floor (recorded during 3s calibration)
  private isCalibratingNoise = false;
  private restingTremorSamples: number[] = [];
  private calibratedRestingPeak = 0.02;

  // Cadence walking timeout timer
  private walkingTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActiveWalkingTime = 0;

  // GPS State
  private gpsWatchId: number | null = null;
  private gpsStatus: GpsStatus = 'off';
  private gpsSpeedMps = 0;
  private lastGpsLat: number | null = null;
  private lastGpsLon: number | null = null;
  private lastGpsTimestamp = 0;
  private accumulatedGpsDistanceMeters = 0;

  // Sensor heartbeat
  private sensorActive = false;
  private lastSensorSampleTime = 0;
  private sensorCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Event Listeners
  private stepListeners: Array<(state: WalkingState) => void> = [];
  private stateChangeListeners: Array<(isWalking: boolean, state: WalkingState) => void> = [];

  constructor() {
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
    this.handleGpsSuccess = this.handleGpsSuccess.bind(this);
    this.handleGpsError = this.handleGpsError.bind(this);
  }

  public setSensitivity(sens: WalkingSensitivity): void {
    this.sensitivity = sens;
  }

  public setGpsEnabled(enabled: boolean): void {
    this.gpsEnabled = enabled;
    if (this.isRunning) {
      if (enabled) {
        this.startGps();
      } else {
        this.stopGps();
      }
    }
  }

  /**
   * Called when transitioning from calibration to active play.
   * Grants a startup grace window (~2.6s) so the player can take their first
   * deliberate step without being immediately paused.
   */
  public armStartupGrace(startupGraceMs = 2600): void {
    this.setWalkingState(true, 'sensor');
    this.lastActiveWalkingTime = performance.now();

    if (this.walkingTimeoutTimer) {
      clearTimeout(this.walkingTimeoutTimer);
    }
    this.walkingTimeoutTimer = setTimeout(() => {
      // If no steps were taken during startup grace, pause the game
      const now = performance.now();
      const elapsedSinceStep = now - this.lastStepTimestamp;
      const elapsedSinceArm = now - this.lastActiveWalkingTime;

      // Check if outdoor GPS shows active movement
      if (this.gpsSpeedMps >= 0.4) {
        this.armStartupGrace(1500);
        return;
      }

      if (this.lastStepTimestamp === 0 || elapsedSinceStep >= startupGraceMs || elapsedSinceArm >= startupGraceMs) {
        this.setWalkingState(false, 'sensor');
      }
    }, startupGraceMs);
  }

  /**
   * Begin recording baseline stationary noise floor during the 3-second bowl calibration
   * while the user holds the phone steady in their palms.
   */
  public startCalibrationRecording(): void {
    this.isCalibratingNoise = true;
    this.restingTremorSamples = [];
  }

  /**
   * Finalize calibration noise floor based on user's actual resting hand tremor
   */
  public finishCalibrationRecording(): void {
    this.isCalibratingNoise = false;
    if (this.restingTremorSamples.length > 20) {
      // Sort to discard brief outliers
      const sorted = [...this.restingTremorSamples].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95Val = sorted[p95Index];
      // Clamped to realistic resting hand tremor range (0.015 to 0.07 m/s^2)
      this.calibratedRestingPeak = Math.max(0.015, Math.min(0.07, p95Val));
    }
    this.restingTremorSamples = [];
  }

  public async requestPermission(): Promise<boolean> {
    let motionGranted = true;
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const res = await (
          DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        motionGranted = res === 'granted';
      } catch {
        motionGranted = false;
      }
    }

    if (this.gpsEnabled && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          () => {
            this.gpsStatus = 'active';
          },
          () => {
            this.gpsStatus = 'unavailable';
          },
          { enableHighAccuracy: true, timeout: 3000, maximumAge: 10000 }
        );
      } catch {
        // Ignore in sandbox
      }
    }

    return motionGranted;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isGravityInitialized = false;
    this.lastVertBounce = 0;
    this.vertHp = 0;
    this.vertBp = 0;
    this.vertSmoothed = 0;
    this.isStepArmed = false;
    this.stepPeakValue = 0;
    this.currentMotionEnergy = 0;
    this.currentFilteredMag = 0;
    this.lastSensorSampleTime = performance.now();

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', this.handleDeviceMotion, { passive: true });
    }

    if (this.gpsEnabled) {
      this.startGps();
    }

    // Heartbeat check for sensor connectivity
    if (this.sensorCheckInterval) clearInterval(this.sensorCheckInterval);
    this.sensorCheckInterval = setInterval(() => {
      const now = performance.now();
      this.sensorActive = now - this.lastSensorSampleTime < 600;
    }, 500);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
    }
    this.stopGps();
    if (this.walkingTimeoutTimer) {
      clearTimeout(this.walkingTimeoutTimer);
      this.walkingTimeoutTimer = null;
    }
    if (this.sensorCheckInterval) {
      clearInterval(this.sensorCheckInterval);
      this.sensorCheckInterval = null;
    }
    this.sensorActive = false;
  }

  public reset(): void {
    this.steps = 0;
    this.isWalking = false;
    this.lastStepTimestamp = 0;
    this.recentStepTimes = [];
    this.accumulatedGpsDistanceMeters = 0;
    this.lastGpsLat = null;
    this.lastGpsLon = null;
    this.isStepArmed = false;
    this.stepPeakValue = 0;
    this.currentMotionEnergy = 0;
    this.currentFilteredMag = 0;
    if (this.walkingTimeoutTimer) {
      clearTimeout(this.walkingTimeoutTimer);
      this.walkingTimeoutTimer = null;
    }
  }

  public onStep(callback: (state: WalkingState) => void): () => void {
    this.stepListeners.push(callback);
    return () => {
      this.stepListeners = this.stepListeners.filter((cb) => cb !== callback);
    };
  }

  public onStateChange(callback: (isWalking: boolean, state: WalkingState) => void): () => void {
    this.stateChangeListeners.push(callback);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((cb) => cb !== callback);
    };
  }

  public getState(): WalkingState {
    const stepMeters = this.steps * STRIDE_LENGTH_METERS;
    const finalMeters = Math.max(stepMeters, this.accumulatedGpsDistanceMeters);
    const finalFeet = finalMeters * (STRIDE_LENGTH_FEET / STRIDE_LENGTH_METERS);

    // Calculate cadence from recent steps
    let cadence = 0;
    const now = performance.now();
    const validTimes = this.recentStepTimes.filter((t) => now - t < 10000);
    if (validTimes.length >= 2) {
      const durationSec = (validTimes[validTimes.length - 1] - validTimes[0]) / 1000;
      if (durationSec > 0) {
        cadence = Math.round(((validTimes.length - 1) / durationSec) * 60);
      }
    }

    return {
      isWalking: this.isWalking,
      steps: this.steps,
      distanceMeters: Math.round(finalMeters * 10) / 10,
      distanceFeet: Math.round(finalFeet * 10) / 10,
      currentCadenceStepsPerMin: cadence,
      motionEnergy: this.isWalking ? Math.min(1.0, Math.round(this.currentMotionEnergy * 100) / 100) : 0,
      lastMotionMagnitude: Math.round(this.currentFilteredMag * 1000) / 1000,
      gpsStatus: this.gpsStatus,
      gpsSpeedMps: Math.round(this.gpsSpeedMps * 10) / 10,
      sensorActive: this.sensorActive,
      source: this.gpsSpeedMps >= 0.35 ? 'fusion' : 'sensor',
    };
  }

  /**
   * Used for desktop development, simulation, or keyboard steps
   */
  public simulateStep(): void {
    this.recordStep(performance.now(), 'simulated');
  }

  // --------------------------------------------------------------------------
  // CORE SENSING & BANDPASS FILTER PIPELINE
  // --------------------------------------------------------------------------

  private handleDeviceMotion(e: DeviceMotionEvent): void {
    const now = performance.now();
    this.lastSensorSampleTime = now;
    this.sensorActive = true;

    // 1. EXTRACT 3D ACCELERATION
    let rawAx = 0;
    let rawAy = 0;
    let rawAz = 0;

    const hasTotal =
      e.accelerationIncludingGravity &&
      e.accelerationIncludingGravity.x !== null &&
      e.accelerationIncludingGravity.y !== null &&
      e.accelerationIncludingGravity.z !== null;

    const hasLinear =
      e.acceleration &&
      e.acceleration.x !== null &&
      e.acceleration.y !== null &&
      e.acceleration.z !== null;

    if (hasTotal) {
      rawAx = e.accelerationIncludingGravity!.x || 0;
      rawAy = e.accelerationIncludingGravity!.y || 0;
      rawAz = e.accelerationIncludingGravity!.z || 0;
    } else if (hasLinear) {
      rawAx = e.acceleration!.x || 0;
      rawAy = e.acceleration!.y || 0;
      rawAz = (e.acceleration!.z || 0) + 9.80665;
    } else {
      return;
    }

    // 2. DYNAMIC 3D GRAVITY VECTOR TRACKING (Low-pass filter at ~0.6 Hz)
    if (!this.isGravityInitialized) {
      this.gravX = rawAx;
      this.gravY = rawAy;
      this.gravZ = rawAz;
      this.isGravityInitialized = true;
    } else {
      const alpha = 0.92;
      this.gravX = this.gravX * alpha + rawAx * (1 - alpha);
      this.gravY = this.gravY * alpha + rawAy * (1 - alpha);
      this.gravZ = this.gravZ * alpha + rawAz * (1 - alpha);
    }

    const gravMagnitude = Math.hypot(this.gravX, this.gravY, this.gravZ) || 9.80665;
    const gUnitX = this.gravX / gravMagnitude;
    const gUnitY = this.gravY / gravMagnitude;
    const gUnitZ = this.gravZ / gravMagnitude;

    // 3. DYNAMIC BODY ACCELERATION (Vector minus Gravity)
    const dynX = rawAx - this.gravX;
    const dynY = rawAy - this.gravY;
    const dynZ = rawAz - this.gravZ;

    // 4. EARTH-RELATIVE VERTICAL BOUNCE PROJECTION
    // The physical center of mass vertical oscillation of bipedal walking
    const vertBounce = dynX * gUnitX + dynY * gUnitY + dynZ * gUnitZ;

    // 5. DIGITAL BANDPASS FILTER (0.7 Hz to 2.8 Hz)
    // Stage A: High-Pass (DC & slow tilt removal < 0.6 Hz)
    const hpAlpha = 0.94;
    this.vertHp = hpAlpha * (this.vertHp + vertBounce - this.lastVertBounce);
    this.lastVertBounce = vertBounce;

    // Stage B: Low-Pass (Physiological tremor removal > 2.8 Hz)
    const lpAlpha = 0.72;
    this.vertBp = lpAlpha * this.vertBp + (1 - lpAlpha) * this.vertHp;

    // Stage C: Second-pole smoothing for clean zero-crossing and peak detection
    this.vertSmoothed = 0.65 * this.vertSmoothed + 0.35 * this.vertBp;
    const sVert = this.vertSmoothed;
    this.currentFilteredMag = Math.abs(sVert);

    // Record noise samples during bowl calibration
    if (this.isCalibratingNoise) {
      this.restingTremorSamples.push(Math.abs(sVert));
      if (this.restingTremorSamples.length > 200) this.restingTremorSamples.shift();
      return;
    }

    // 6. ADAPTIVE SENSITIVITY THRESHOLDS
    const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
    // Guaranteed to be strictly above the user's calibrated resting hand tremor
    const effectivePeakThresh = Math.max(config.stepPeakThresh, this.calibratedRestingPeak * 1.55);
    const effectiveValleyThresh = -Math.max(
      Math.abs(config.stepValleyThresh),
      this.calibratedRestingPeak * 0.9
    );
    const effectiveP2pThresh = Math.max(config.stepP2pThresh, this.calibratedRestingPeak * 2.2);

    // Update motion energy indicator (normalized 0.0 to 1.0)
    const normalizedEnergy = Math.min(1.0, Math.abs(sVert) / (effectivePeakThresh * 2.0));
    this.currentMotionEnergy = 0.8 * this.currentMotionEnergy + 0.2 * normalizedEnergy;

    // 7. PEAK & VALLEY STEP STATE MACHINE
    // A genuine bipedal step consists of a positive vertical rise (peak)
    // followed by a zero-crossing into a negative trough (valley)
    if (!this.isStepArmed) {
      if (sVert >= effectivePeakThresh) {
        this.isStepArmed = true;
        this.stepPeakValue = sVert;
      }
    } else {
      if (sVert > this.stepPeakValue) {
        this.stepPeakValue = sVert;
      } else if (sVert <= effectiveValleyThresh) {
        // Zero-crossing into valley confirmed! Check peak-to-peak amplitude
        const p2p = this.stepPeakValue - sVert;
        const timeSinceLastStep = now - this.lastStepTimestamp;

        if (p2p >= effectiveP2pThresh) {
          if (timeSinceLastStep >= MIN_STEP_INTERVAL_MS && timeSinceLastStep <= MAX_STEP_INTERVAL_MS) {
            this.recordStep(now, 'sensor');
          } else if (timeSinceLastStep > MAX_STEP_INTERVAL_MS) {
            // First step after a rest or pause
            this.recordStep(now, 'sensor');
          }
        }

        // Reset step state machine
        this.isStepArmed = false;
        this.stepPeakValue = 0;
      }
    }
  }

  // --------------------------------------------------------------------------
  // GPS GEOLOCATION ENGINE
  // --------------------------------------------------------------------------

  private startGps(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.gpsStatus = 'unavailable';
      return;
    }

    this.gpsStatus = 'searching';
    try {
      this.gpsWatchId = navigator.geolocation.watchPosition(
        this.handleGpsSuccess,
        this.handleGpsError,
        {
          enableHighAccuracy: true,
          maximumAge: 1500,
          timeout: 6000,
        }
      );
    } catch {
      this.gpsStatus = 'unavailable';
    }
  }

  private stopGps(): void {
    if (this.gpsWatchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.gpsWatchId);
      this.gpsWatchId = null;
    }
    this.gpsStatus = this.gpsEnabled ? 'searching' : 'off';
    this.gpsSpeedMps = 0;
  }

  private handleGpsSuccess(position: GeolocationPosition): void {
    this.gpsStatus = 'active';
    const now = performance.now();
    const coords = position.coords;

    // Check GPS speed (walking speed: >= 0.35 m/s or ~1.3 km/h, accuracy <= 20m)
    if (typeof coords.speed === 'number' && coords.speed !== null && !isNaN(coords.speed)) {
      this.gpsSpeedMps = coords.speed;
      if (coords.speed >= 0.35 && coords.accuracy <= 20) {
        this.lastActiveWalkingTime = now;
        if (!this.isWalking) {
          this.setWalkingState(true, 'gps');
        }
        const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
        this.resetWalkingTimeout(config.stepTimeoutMs + 400);
      }
    }

    // Displacement check
    if (coords.accuracy <= 20) {
      if (this.lastGpsLat !== null && this.lastGpsLon !== null && this.lastGpsTimestamp > 0) {
        const dtSec = (now - this.lastGpsTimestamp) / 1000;
        if (dtSec >= 1.5 && dtSec <= 8.0) {
          const distMeters = this.calculateHaversineDistance(
            this.lastGpsLat,
            this.lastGpsLon,
            coords.latitude,
            coords.longitude
          );

          const speedDerived = distMeters / dtSec;
          if (distMeters >= 1.5 && speedDerived >= 0.35 && speedDerived <= 3.2) {
            this.accumulatedGpsDistanceMeters += distMeters;
            this.lastActiveWalkingTime = now;
            if (!this.isWalking) {
              this.setWalkingState(true, 'gps');
            }
            const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
            this.resetWalkingTimeout(config.stepTimeoutMs + 400);
          }
        }
      }

      this.lastGpsLat = coords.latitude;
      this.lastGpsLon = coords.longitude;
      this.lastGpsTimestamp = now;
    }
  }

  private handleGpsError(err: GeolocationPositionError): void {
    if (err.code === err.PERMISSION_DENIED) {
      this.gpsStatus = 'off';
    } else {
      this.gpsStatus = 'unavailable';
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --------------------------------------------------------------------------
  // STEP RECORDING & CADENCE CONTINUITY
  // --------------------------------------------------------------------------

  private recordStep(now: number, source: 'sensor' | 'gps' | 'simulated'): void {
    this.steps += 1;
    this.lastStepTimestamp = now;
    this.lastActiveWalkingTime = now;
    this.recentStepTimes.push(now);
    if (this.recentStepTimes.length > 20) {
      this.recentStepTimes.shift();
    }

    // Immediate transition to WALKING when a step is taken
    if (!this.isWalking) {
      this.setWalkingState(true, source);
    }

    // Schedule / refresh the walking cadence timeout
    // If no step is taken within stepTimeoutMs, the state will transition to PAUSED
    const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
    this.resetWalkingTimeout(config.stepTimeoutMs);

    // Notify listeners
    const state = this.getState();
    this.stepListeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in stepListener:', err);
      }
    });
  }

  private resetWalkingTimeout(timeoutMs: number): void {
    if (this.walkingTimeoutTimer) {
      clearTimeout(this.walkingTimeoutTimer);
    }

    this.walkingTimeoutTimer = setTimeout(() => {
      // If GPS is currently moving >= 0.35 m/s outdoors, extend timeout
      if (this.gpsSpeedMps >= 0.35) {
        this.resetWalkingTimeout(1200);
        return;
      }

      // No step was taken within timeout -> user has stopped / is standing still!
      this.setWalkingState(false, 'sensor');
    }, timeoutMs);
  }

  private setWalkingState(
    newWalkingState: boolean,
    source: 'sensor' | 'gps' | 'fusion' | 'simulated'
  ): void {
    if (this.isWalking === newWalkingState) return;
    this.isWalking = newWalkingState;
    const state = this.getState();
    state.source = source;
    this.stateChangeListeners.forEach((cb) => {
      try {
        cb(newWalkingState, state);
      } catch (err) {
        console.error('Error in stateChangeListener:', err);
      }
    });
  }
}

// Helper to format walking distance according to user preference
export function formatWalkingDistance(
  steps: number,
  unit: DistanceUnit = 'both',
  overrideMeters?: number
): { formatted: string; feet: number; meters: number } {
  const meters =
    typeof overrideMeters === 'number' && overrideMeters > 0
      ? Math.round(overrideMeters * 10) / 10
      : Math.round(steps * STRIDE_LENGTH_METERS * 10) / 10;
  const feet = Math.round(meters * (STRIDE_LENGTH_FEET / STRIDE_LENGTH_METERS) * 10) / 10;

  let formatted = '';
  switch (unit) {
    case 'feet':
      formatted = `${feet} ft`;
      break;
    case 'meters':
      formatted = `${meters} m`;
      break;
    case 'both':
    default:
      formatted = `${feet} ft (${meters} m)`;
      break;
  }

  return { formatted, feet, meters };
}

// Global detector singleton
export const walkingDetector = new WalkingDetector();
