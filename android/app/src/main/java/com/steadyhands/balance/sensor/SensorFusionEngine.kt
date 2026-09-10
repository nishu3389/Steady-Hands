package com.steadyhands.balance.sensor

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlin.math.*

class SensorFusionEngine(context: Context) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val accelerometer: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    // Observable states for Compose
    var pitch by mutableFloatStateOf(0f) // X tilt (-90 to +90 deg)
    var roll by mutableFloatStateOf(0f)  // Y tilt (-90 to +90 deg)
    var totalTilt by mutableFloatStateOf(0f) // Magnitude in degrees
    var stepCount by mutableIntStateOf(0)
    var currentCadence by mutableIntStateOf(0) // Steps per min
    var waterRemaining by mutableFloatStateOf(100f) // 0 to 100%
    var isSpilling by mutableStateOf(false)
    var isRunning by mutableStateOf(false)

    // Filter variables
    private var gravityX = 0f
    private var gravityY = 0f
    private var gravityZ = 9.8f
    private val alpha = 0.85f

    // Step detection variables
    private var lastAccMagnitude = 9.8f
    private var isPeakDetected = false
    private val stepTimes = mutableListOf<Long>()
    private var lastStepTime = 0L

    // Spillage physics
    var safeAngleThreshold = 10f // degrees
    private var lastSpillCheckTime = System.currentTimeMillis()

    fun start() {
        if (isRunning) return
        isRunning = true
        sensorManager?.let { sm ->
            accelerometer?.let { acc ->
                sm.registerListener(this, acc, SensorManager.SENSOR_DELAY_GAME)
            }
            gyroscope?.let { gyro ->
                sm.registerListener(this, gyro, SensorManager.SENSOR_DELAY_GAME)
            }
        }
        lastSpillCheckTime = System.currentTimeMillis()
    }

    fun stop() {
        if (!isRunning) return
        isRunning = false
        sensorManager?.unregisterListener(this)
    }

    fun reset() {
        stepCount = 0
        currentCadence = 0
        waterRemaining = 100f
        isSpilling = false
        stepTimes.clear()
        lastStepTime = 0L
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || !isRunning) return

        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            val rawX = event.values[0]
            val rawY = event.values[1]
            val rawZ = event.values[2]

            // Low-pass filter to isolate gravity
            gravityX = alpha * gravityX + (1 - alpha) * rawX
            gravityY = alpha * gravityY + (1 - alpha) * rawY
            gravityZ = alpha * gravityZ + (1 - alpha) * rawZ

            // Calculate tilt angles in degrees
            val currentPitch = Math.toDegrees(atan2(gravityY.toDouble(), sqrt((gravityX * gravityX + gravityZ * gravityZ).toDouble()))).toFloat()
            val currentRoll = Math.toDegrees(atan2(-gravityX.toDouble(), gravityZ.toDouble())).toFloat()

            pitch = currentPitch
            roll = currentRoll
            totalTilt = sqrt(pitch * pitch + roll * roll)

            // Spillage calculation
            val now = System.currentTimeMillis()
            val dt = (now - lastSpillCheckTime) / 1000f
            lastSpillCheckTime = now

            if (totalTilt > safeAngleThreshold) {
                isSpilling = true
                val excess = (totalTilt - safeAngleThreshold)
                val spillRate = excess * 0.8f // % per second per degree over limit
                waterRemaining = (waterRemaining - spillRate * dt).coerceAtLeast(0f)
            } else {
                isSpilling = false
            }

            // Step Detection via high-pass dynamic peak
            val currentMag = sqrt(rawX * rawX + rawY * rawY + rawZ * rawZ)
            val deltaMag = currentMag - lastAccMagnitude
            lastAccMagnitude = currentMag

            if (deltaMag > 1.2f && !isPeakDetected && (now - lastStepTime > 320)) {
                isPeakDetected = true
                lastStepTime = now
                stepCount++
                stepTimes.add(now)

                // Clean old step times (> 10 sec)
                while (stepTimes.isNotEmpty() && now - stepTimes.first() > 10_000) {
                    stepTimes.removeAt(0)
                }

                // Compute cadence (steps per minute)
                if (stepTimes.size >= 2) {
                    val durationSec = (stepTimes.last() - stepTimes.first()) / 1000f
                    if (durationSec > 1f) {
                        currentCadence = ((stepTimes.size - 1) / durationSec * 60f).roundToInt()
                    }
                }
            } else if (deltaMag < 0.2f) {
                isPeakDetected = false
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op
    }
}
