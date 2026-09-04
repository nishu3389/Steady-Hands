// Multi-Modal Mindful Walking & Sensor Fusion Engine
// Detects gentle bipedal walking motion even when the user is holding the phone
// flat and steady to balance the water bowl, using:
// 1. 3D Gravity Vector Tracking & Earth-Axis Vertical Bounce Projection
// 2. Gyroscopic Pelvic/Torso Sway Cadence
// 3. Sliding-Window Motion Energy & Variance (SMA)
// 4. Adaptive Thresholding with Ambient Noise Floor Calibration
// 5. GPS Geolocation High-Accuracy Velocity & Displacement Fusion

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
  accelVarianceThresh: number;
  vertPeakThresh: number;
  gyroRateThresh: number;
  graceWindowMs: number;
}

const SENSITIVITY_CONFIGS: Record<WalkingSensitivity, SensitivityConfig> = {
  // Ultra-sensitive for steady-hands bowl balancing (detects 0.038 m/s^2 micro-bounces)
  high: {
    accelVarianceThresh: 0.012,
    vertPeakThresh: 0.035,
    gyroRateThresh: 1.2, // deg/s
    graceWindowMs: 2800,
  },
  // Standard everyday walking
  medium: {
    accelVarianceThresh: 0.024,
    vertPeakThresh: 0.075,
    gyroRateThresh: 2.8,
    graceWindowMs: 2400,
  },
  // Brisk / active motion
  low: {
    accelVarianceThresh: 0.045,
    vertPeakThresh: 0.14,
    gyroRateThresh: 5.0,
    graceWindowMs: 2000,
  },
};

// Refractory period: prevents double-counting on a single heel strike (max ~170 steps/min)
const MIN_STEP_INTERVAL_MS = 340;
// Maximum expected interval between deliberate mindful steps (min ~30 steps/min)
const MAX_STEP_INTERVAL_MS = 2200;

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

  // Rolling motion window for continuous activity energy (variance / SMA)
  private readonly WINDOW_SIZE = 36; // ~600ms at 60Hz
  private motionBuffer: number[] = [];
  private bufferIndex = 0;
  private currentMotionEnergy = 0;
  private currentRawMag = 0;

  // Step state machine
  private isStepArmed = false;
  private stepPeakValue = 0;
  private bandpassVertVal = 0;

  // Ambient calibration / noise floor
  private isCalibratingNoise = false;
  private noiseSamples: number[] = [];
  private calibratedNoiseFloor = 0.008;

  // Grace timer & state continuity
  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActiveMotionTime = 0;

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
   * Grants a startup grace window so the player isn't immediately greeted with "PAUSED"
   * before taking their first deliberate step.
   */
  public armStartupGrace(startupGraceMs = 3000): void {
    this.setWalkingState(true, 'sensor');
    this.lastActiveMotionTime = performance.now();

    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
    }
    this.graceTimer = setTimeout(() => {
      // If no motion or steps were taken during startup grace, pause
      const timeSinceMotion = performance.now() - this.lastActiveMotionTime;
      if (timeSinceMotion >= startupGraceMs) {
        this.setWalkingState(false, 'sensor');
      }
    }, startupGraceMs);
  }

  /**
   * Begin recording baseline stationary noise floor during the 3-second bowl calibration
   */
  public startCalibrationRecording(): void {
    this.isCalibratingNoise = true;
    this.noiseSamples = [];
  }

  /**
   * Finalize calibration noise floor
   */
  public finishCalibrationRecording(): void {
    this.isCalibratingNoise = false;
    if (this.noiseSamples.length > 10) {
      const sum = this.noiseSamples.reduce((a, b) => a + b, 0);
      const avg = sum / this.noiseSamples.length;
      // Clamped to a sane physiological resting range (0.005 to 0.025 m/s^2)
      this.calibratedNoiseFloor = Math.max(0.005, Math.min(0.025, avg * 1.15));
    }
    this.noiseSamples = [];
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

    // Attempt geolocation permission check/prompt if enabled
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
        // Ignore geolocation failure in sandbox
      }
    }

    return motionGranted;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isGravityInitialized = false;
    this.motionBuffer = new Array(this.WINDOW_SIZE).fill(0);
    this.bufferIndex = 0;
    this.currentMotionEnergy = 0;
    this.currentRawMag = 0;
    this.isStepArmed = false;
    this.stepPeakValue = 0;
    this.bandpassVertVal = 0;
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
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
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
    this.currentRawMag = 0;
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
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
    // Determine distance: use step distance, or GPS if higher and validated
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
      motionEnergy: Math.min(1.0, Math.round(this.currentMotionEnergy * 100) / 100),
      lastMotionMagnitude: Math.round(this.currentRawMag * 1000) / 1000,
      gpsStatus: this.gpsStatus,
      gpsSpeedMps: Math.round(this.gpsSpeedMps * 10) / 10,
      sensorActive: this.sensorActive,
      source: this.gpsSpeedMps >= 0.25 ? 'fusion' : 'sensor',
    };
  }

  /**
   * Used for desktop development, simulation, or keyboard steps
   */
  public simulateStep(): void {
    this.recordStep(performance.now(), 'simulated');
  }

  // --------------------------------------------------------------------------
  // CORE SENSING & FUSION LOGIC
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

    // 2. DYNAMIC 3D GRAVITY VECTOR TRACKING (Low-pass filter)
    if (!this.isGravityInitialized) {
      this.gravX = rawAx;
      this.gravY = rawAy;
      this.gravZ = rawAz;
      this.isGravityInitialized = true;
    } else {
      // Time constant ~0.6s: adapts to slow phone orientation changes while
      // preserving dynamic body oscillations
      const alpha = 0.93;
      this.gravX = this.gravX * alpha + rawAx * (1 - alpha);
      this.gravY = this.gravY * alpha + rawAy * (1 - alpha);
      this.gravZ = this.gravZ * alpha + rawAz * (1 - alpha);
    }

    const gravMagnitude = Math.hypot(this.gravX, this.gravY, this.gravZ) || 9.80665;
    const gUnitX = this.gravX / gravMagnitude;
    const gUnitY = this.gravY / gravMagnitude;
    const gUnitZ = this.gravZ / gravMagnitude;

    // 3. DYNAMIC BODY ACCELERATION (High-pass filter: vector minus gravity)
    const dynX = rawAx - this.gravX;
    const dynY = rawAy - this.gravY;
    const dynZ = rawAz - this.gravZ;

    // 4. VERTICAL BOUNCE PROJECTION (Earth-relative vertical axis)
    // This is the fundamental, inescapable signature of bipedal walking:
    // With every step, the center of mass bobs up and down ~2-4 cm!
    const vertBounce = dynX * gUnitX + dynY * gUnitY + dynZ * gUnitZ;

    // Horizontal sway
    const horizX = dynX - vertBounce * gUnitX;
    const horizY = dynY - vertBounce * gUnitY;
    const horizZ = dynZ - vertBounce * gUnitZ;
    const horizMag = Math.hypot(horizX, horizY, horizZ);

    // 5. GYROSCOPIC TORSO/PELVIC SWAY
    let gyroRateDegPerSec = 0;
    if (e.rotationRate && e.rotationRate.alpha !== null) {
      const ra = e.rotationRate.alpha || 0;
      const rb = e.rotationRate.beta || 0;
      const rg = e.rotationRate.gamma || 0;
      gyroRateDegPerSec = Math.hypot(ra, rb, rg);
    }

    // 6. MULTI-AXIS COMBINED SAMPLE
    // Weighted combination of earth-vertical bounce, horizontal sway, and torso rotation
    const instantSample =
      Math.abs(vertBounce) * 1.5 + horizMag * 0.6 + (gyroRateDegPerSec * 0.012);
    this.currentRawMag = instantSample;

    // Record noise samples if in calibration
    if (this.isCalibratingNoise) {
      this.noiseSamples.push(instantSample);
      if (this.noiseSamples.length > 180) this.noiseSamples.shift();
      return;
    }

    // 7. SLIDING-WINDOW MOTION ENERGY & VARIANCE (Continuous Walking Signature)
    this.motionBuffer[this.bufferIndex] = instantSample;
    this.bufferIndex = (this.bufferIndex + 1) % this.WINDOW_SIZE;

    // Compute rolling mean and variance across the buffer
    let sum = 0;
    for (let i = 0; i < this.WINDOW_SIZE; i++) {
      sum += this.motionBuffer[i];
    }
    const mean = sum / this.WINDOW_SIZE;

    let varianceSum = 0;
    for (let i = 0; i < this.WINDOW_SIZE; i++) {
      const diff = this.motionBuffer[i] - mean;
      varianceSum += diff * diff;
    }
    const rollingVariance = Math.sqrt(varianceSum / this.WINDOW_SIZE);

    // Normalized motion energy (0.0 to 1.0)
    this.currentMotionEnergy = Math.min(1.0, rollingVariance * 8.0 + mean * 2.0);

    // 8. CONTINUOUS MOTION CHECK AGAINST ADAPTIVE SENSITIVITY THRESHOLDS
    const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
    const effectiveVarianceThresh = Math.max(
      config.accelVarianceThresh,
      this.calibratedNoiseFloor * 1.25
    );

    const hasSustainedWalkingMotion =
      rollingVariance >= effectiveVarianceThresh ||
      gyroRateDegPerSec >= config.gyroRateThresh;

    if (hasSustainedWalkingMotion) {
      this.lastActiveMotionTime = now;
      if (!this.isWalking) {
        this.setWalkingState(true, 'sensor');
      }
      this.resetGraceTimer(config.graceWindowMs);
    }

    // 9. STEP CADENCE & WAVEFORM DETECTION
    // Gentle bandpass filter on vertical bounce
    this.bandpassVertVal = this.bandpassVertVal * 0.65 + vertBounce * 0.35;
    const vertVal = this.bandpassVertVal;
    const effectivePeakThresh = config.vertPeakThresh;

    if (!this.isStepArmed) {
      if (vertVal > effectivePeakThresh) {
        this.isStepArmed = true;
        this.stepPeakValue = vertVal;
      }
    } else {
      if (vertVal > this.stepPeakValue) {
        this.stepPeakValue = vertVal;
      } else if (vertVal < -effectivePeakThresh * 0.4) {
        // Zero-crossing & valley confirmed -> step completed!
        const timeSinceLastStep = now - this.lastStepTimestamp;
        if (timeSinceLastStep >= MIN_STEP_INTERVAL_MS && timeSinceLastStep <= MAX_STEP_INTERVAL_MS) {
          this.recordStep(now, 'sensor');
        } else if (timeSinceLastStep > MAX_STEP_INTERVAL_MS) {
          // First step after a rest
          this.recordStep(now, 'sensor');
        }
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

    // Check instantaneous speed if provided by GPS chip
    if (typeof coords.speed === 'number' && coords.speed !== null && !isNaN(coords.speed)) {
      this.gpsSpeedMps = coords.speed;
      // Walking speed: >= 0.25 m/s (~0.9 km/h)
      if (coords.speed >= 0.25) {
        this.lastActiveMotionTime = now;
        if (!this.isWalking) {
          this.setWalkingState(true, 'gps');
        }
        const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
        this.resetGraceTimer(config.graceWindowMs + 400);
      }
    }

    // Check displacement if accuracy is decent (< 25 meters)
    if (coords.accuracy <= 25) {
      if (this.lastGpsLat !== null && this.lastGpsLon !== null && this.lastGpsTimestamp > 0) {
        const dtSec = (now - this.lastGpsTimestamp) / 1000;
        if (dtSec >= 1.2 && dtSec <= 8.0) {
          const distMeters = this.calculateHaversineDistance(
            this.lastGpsLat,
            this.lastGpsLon,
            coords.latitude,
            coords.longitude
          );

          // Realistic walking speed: 0.3 m/s to 3.0 m/s
          const speedDerived = distMeters / dtSec;
          if (distMeters >= 1.2 && speedDerived >= 0.25 && speedDerived <= 3.5) {
            this.accumulatedGpsDistanceMeters += distMeters;
            this.lastActiveMotionTime = now;
            if (!this.isWalking) {
              this.setWalkingState(true, 'gps');
            }
            const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
            this.resetGraceTimer(config.graceWindowMs + 400);
          }
        }
      }

      this.lastGpsLat = coords.latitude;
      this.lastGpsLon = coords.longitude;
      this.lastGpsTimestamp = now;
    }
  }

  private handleGpsError(err: GeolocationPositionError): void {
    // In many indoor environments or if permission denied, GPS will fail.
    // The app falls back 100% smoothly to high-sensitivity IMU sensor fusion.
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
  // STEP RECORDING & STATE CONTINUITY
  // --------------------------------------------------------------------------

  private recordStep(now: number, source: 'sensor' | 'gps' | 'simulated'): void {
    this.steps += 1;
    this.lastStepTimestamp = now;
    this.lastActiveMotionTime = now;
    this.recentStepTimes.push(now);
    if (this.recentStepTimes.length > 20) {
      this.recentStepTimes.shift();
    }

    // Transition to walking if paused
    if (!this.isWalking) {
      this.setWalkingState(true, source);
    }

    // Refresh grace timer
    const config = SENSITIVITY_CONFIGS[this.sensitivity] || SENSITIVITY_CONFIGS.high;
    this.resetGraceTimer(config.graceWindowMs);

    // Notify step listeners
    const state = this.getState();
    this.stepListeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in stepListener:', err);
      }
    });
  }

  private resetGraceTimer(graceMs: number): void {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
    }

    this.graceTimer = setTimeout(() => {
      const now = performance.now();
      const elapsed = now - this.lastActiveMotionTime;
      if (elapsed >= graceMs) {
        this.setWalkingState(false, 'sensor');
      }
    }, graceMs);
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
