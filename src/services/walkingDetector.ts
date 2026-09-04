// Mindful Walking & Step Detection Service
// Detects gentle bipedal walking motion even when the user is holding the phone
// flat and steady to balance the water bowl.

import { DistanceUnit } from '../types';

export interface WalkingState {
  isWalking: boolean;
  steps: number;
  distanceMeters: number;
  distanceFeet: number;
  currentCadenceStepsPerMin: number;
  lastMotionMagnitude: number;
}

// Biomechanical constants for mindful steady walking (e.g. Kinhin meditation)
// Indoors / slow deliberate steps are typically ~0.55 meters (1.80 feet)
export const STRIDE_LENGTH_METERS = 0.55;
export const STRIDE_LENGTH_FEET = 1.804;

// Stride grace window: humans take ~1 step every 0.6s to 1.2s.
// A 1.8s window ensures seamless continuity between steps without timer stutter.
const WALKING_GRACE_WINDOW_MS = 1800;

// Refractory period: prevents double-counting on a single heel strike
const MIN_STEP_INTERVAL_MS = 380;

// Sensitivity threshold for slow, steady mindful steps (linear acceleration m/s^2)
const STEP_PEAK_THRESHOLD = 0.22;
const STEP_VALLEY_THRESHOLD = 0.12;

export class WalkingDetector {
  private isRunning = false;
  private isWalking = false;
  private steps = 0;
  private lastStepTimestamp = 0;
  private lastSampleTimestamp = 0;
  private smoothedLinearMag = 0;
  private gravityEstimate = 9.80665;
  private isPeakArmed = false;
  private peakValue = 0;
  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  private recentStepTimes: number[] = [];

  // Listeners
  private stepListeners: Array<(state: WalkingState) => void> = [];
  private stateChangeListeners: Array<(isWalking: boolean, state: WalkingState) => void> = [];

  constructor() {
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
  }

  public async requestPermission(): Promise<boolean> {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const res = await (
          DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastSampleTimestamp = performance.now();
    this.gravityEstimate = 9.80665;
    this.smoothedLinearMag = 0;
    this.isPeakArmed = false;
    this.peakValue = 0;

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', this.handleDeviceMotion, { passive: true });
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
    }
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
  }

  public reset(): void {
    this.steps = 0;
    this.isWalking = false;
    this.lastStepTimestamp = 0;
    this.recentStepTimes = [];
    this.smoothedLinearMag = 0;
    this.peakValue = 0;
    this.isPeakArmed = false;
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
    const meters = this.steps * STRIDE_LENGTH_METERS;
    const feet = this.steps * STRIDE_LENGTH_FEET;

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
      distanceMeters: Math.round(meters * 10) / 10,
      distanceFeet: Math.round(feet * 10) / 10,
      currentCadenceStepsPerMin: cadence,
      lastMotionMagnitude: Math.round(this.smoothedLinearMag * 100) / 100,
    };
  }

  /**
   * Used for desktop development, simulation, or keyboard steps
   */
  public simulateStep(): void {
    this.recordStep(performance.now());
  }

  private handleDeviceMotion(e: DeviceMotionEvent): void {
    const now = performance.now();
    let rawLinearMag = 0;

    // 1. Check if device directly gives linear acceleration (without gravity)
    if (
      e.acceleration &&
      e.acceleration.z !== null &&
      e.acceleration.x !== null &&
      e.acceleration.y !== null
    ) {
      const ax = e.acceleration.x;
      const ay = e.acceleration.y;
      const az = e.acceleration.z;
      rawLinearMag = Math.sqrt(ax * ax + ay * ay + az * az);
    } else if (e.accelerationIncludingGravity) {
      // 2. Fallback: derive dynamic linear acceleration from total acceleration
      const gx = e.accelerationIncludingGravity.x || 0;
      const gy = e.accelerationIncludingGravity.y || 0;
      const gz = e.accelerationIncludingGravity.z || 0;
      const totalMag = Math.sqrt(gx * gx + gy * gy + gz * gz);

      // Adaptive low-pass gravity filter
      this.gravityEstimate = this.gravityEstimate * 0.96 + totalMag * 0.04;
      rawLinearMag = Math.abs(totalMag - this.gravityEstimate);
    }

    // 3. Smooth with exponential moving average to filter out micro-finger-jitters
    this.smoothedLinearMag = this.smoothedLinearMag * 0.72 + rawLinearMag * 0.28;

    // 4. Biomechanical Peak & Valley State Machine for Steady Walking
    if (!this.isPeakArmed) {
      if (this.smoothedLinearMag > STEP_PEAK_THRESHOLD) {
        this.isPeakArmed = true;
        this.peakValue = this.smoothedLinearMag;
      }
    } else {
      if (this.smoothedLinearMag > this.peakValue) {
        this.peakValue = this.smoothedLinearMag;
      } else if (this.smoothedLinearMag < STEP_VALLEY_THRESHOLD) {
        // Step completed: peak followed by descent into valley
        const timeSinceLastStep = now - this.lastStepTimestamp;
        if (timeSinceLastStep >= MIN_STEP_INTERVAL_MS) {
          this.recordStep(now);
        }
        this.isPeakArmed = false;
        this.peakValue = 0;
      }
    }

    this.lastSampleTimestamp = now;
  }

  private recordStep(now: number): void {
    this.steps += 1;
    this.lastStepTimestamp = now;
    this.recentStepTimes.push(now);
    if (this.recentStepTimes.length > 20) {
      this.recentStepTimes.shift();
    }

    // If wasn't walking, transition to walking
    if (!this.isWalking) {
      this.setWalkingState(true);
    }

    // Reset grace timer
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
    }

    this.graceTimer = setTimeout(() => {
      // No step occurred within the grace window -> user stopped walking
      this.setWalkingState(false);
    }, WALKING_GRACE_WINDOW_MS);

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

  private setWalkingState(newWalkingState: boolean): void {
    if (this.isWalking === newWalkingState) return;
    this.isWalking = newWalkingState;
    const state = this.getState();
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
  unit: DistanceUnit = 'both'
): { formatted: string; feet: number; meters: number } {
  const meters = Math.round(steps * STRIDE_LENGTH_METERS * 10) / 10;
  const feet = Math.round(steps * STRIDE_LENGTH_FEET * 10) / 10;

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
