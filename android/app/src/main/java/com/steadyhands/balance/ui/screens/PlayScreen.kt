package com.steadyhands.balance.ui.screens

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.steadyhands.balance.sensor.SensorFusionEngine
import com.steadyhands.balance.ui.components.NeuCard
import com.steadyhands.balance.ui.components.NeuInset
import com.steadyhands.balance.ui.components.WaterBowlCanvas
import com.steadyhands.balance.ui.theme.*
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

enum class SessionState {
    LOBBY,
    CALIBRATING,
    ACTIVE,
    PAUSED,
    COMPLETED
}

@Composable
fun PlayScreen(
    sensorEngine: SensorFusionEngine,
    onOpenTutorial: () -> Unit
) {
    val context = LocalContext.current
    val vibrator = remember { context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator }
    val isDark = isSystemInDarkTheme()

    var sessionState by remember { mutableStateOf(SessionState.LOBBY) }
    var selectedDurationMinutes by remember { mutableIntStateOf(3) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }
    var calibrationCount by remember { mutableIntStateOf(3) }

    // Haptic feedback on spillage
    LaunchedEffect(sensorEngine.isSpilling) {
        if (sensorEngine.isSpilling && sessionState == SessionState.ACTIVE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(120)
            }
        }
    }

    // Timer loop for active session
    LaunchedEffect(sessionState) {
        if (sessionState == SessionState.ACTIVE) {
            sensorEngine.start()
            while (sessionState == SessionState.ACTIVE) {
                delay(1000)
                elapsedSeconds++
                val targetSecs = selectedDurationMinutes * 60
                if (selectedDurationMinutes > 0 && elapsedSeconds >= targetSecs) {
                    sessionState = SessionState.COMPLETED
                    sensorEngine.stop()
                    break
                }
                if (sensorEngine.waterRemaining <= 0f) {
                    sessionState = SessionState.COMPLETED
                    sensorEngine.stop()
                    break
                }
            }
        } else if (sessionState == SessionState.CALIBRATING) {
            calibrationCount = 3
            while (calibrationCount > 0) {
                delay(1000)
                calibrationCount--
            }
            sensorEngine.reset()
            elapsedSeconds = 0
            sessionState = SessionState.ACTIVE
        } else {
            sensorEngine.stop()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        when (sessionState) {
            SessionState.LOBBY -> {
                LobbyView(
                    selectedDuration = selectedDurationMinutes,
                    onSelectDuration = { selectedDurationMinutes = it },
                    onStart = { sessionState = SessionState.CALIBRATING },
                    onOpenTutorial = onOpenTutorial
                )
            }
            SessionState.CALIBRATING -> {
                CalibratingView(countdown = calibrationCount)
            }
            SessionState.ACTIVE, SessionState.PAUSED -> {
                ActiveSessionView(
                    sensorEngine = sensorEngine,
                    elapsedSeconds = elapsedSeconds,
                    totalSeconds = selectedDurationMinutes * 60,
                    isPaused = sessionState == SessionState.PAUSED,
                    onTogglePause = {
                        sessionState = if (sessionState == SessionState.PAUSED) SessionState.ACTIVE else SessionState.PAUSED
                    },
                    onFinish = {
                        sessionState = SessionState.COMPLETED
                    }
                )
            }
            SessionState.COMPLETED -> {
                ResultsDialog(
                    waterRemaining = sensorEngine.waterRemaining,
                    steps = sensorEngine.stepCount,
                    cadence = sensorEngine.currentCadence,
                    durationSec = elapsedSeconds,
                    onPlayAgain = {
                        sensorEngine.reset()
                        sessionState = SessionState.LOBBY
                    }
                )
            }
        }
    }
}

@Composable
private fun LobbyView(
    selectedDuration: Int,
    onSelectDuration: (Int) -> Unit,
    onStart: () -> Unit,
    onOpenTutorial: () -> Unit
) {
    val isDark = isSystemInDarkTheme()

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text(
            text = "Mindful Walking Balance",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary,
            textAlign = TextAlign.Center
        )

        Text(
            text = "Carry the virtual tea bowl without spilling a single drop. Smooth, gliding steps cultivate tranquil focus.",
            style = MaterialTheme.typography.bodyMedium,
            color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary,
            textAlign = TextAlign.Center
        )

        // Bowl Preview
        WaterBowlCanvas(
            pitch = 0f,
            roll = 0f,
            waterRemaining = 100f,
            isSpilling = false,
            modifier = Modifier.size(240.dp)
        )

        // Duration Selection Chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf(1 to "1 Min", 3 to "3 Min", 5 to "5 Min", 0 to "Free").forEach { (duration, label) ->
                val isSelected = selectedDuration == duration
                Surface(
                    onClick = { onSelectDuration(duration) },
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSelected) ZenTealPrimary else (if (isDark) ZenDarkCard else ZenLightCard),
                    border = if (!isSelected) BorderStroke(1.dp, if (isDark) ZenDarkBorder else ZenLightBorder) else null
                ) {
                    Text(
                        text = label,
                        color = if (isSelected) Color.White else (if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary),
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }
        }

        // Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onOpenTutorial,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
            ) {
                Icon(Icons.Default.School, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Tutorial", fontWeight = FontWeight.SemiBold)
            }

            Button(
                onClick = onStart,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ZenTealPrimary),
                modifier = Modifier
                    .weight(1.5f)
                    .height(52.dp)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Begin Walk", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun CalibratingView(countdown: Int) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Hold Steady",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = ZenTealPrimary
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Level phone horizontally. Take a deep breath.",
            style = MaterialTheme.typography.bodyMedium,
            color = ZenDarkTextSecondary
        )
        Spacer(modifier = Modifier.height(32.dp))

        Box(
            modifier = Modifier
                .size(140.dp)
                .clip(CircleShape)
                .background(ZenTealPrimary.copy(alpha = 0.15f))
                .border(2.dp, ZenTealPrimary, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (countdown > 0) "$countdown" else "Walk!",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold,
                color = ZenTealPrimary
            )
        }
    }
}

@Composable
private fun ActiveSessionView(
    sensorEngine: SensorFusionEngine,
    elapsedSeconds: Int,
    totalSeconds: Int,
    isPaused: Boolean,
    onTogglePause: () -> Unit,
    onFinish: () -> Unit
) {
    val isDark = isSystemInDarkTheme()

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top HUD (Timer & Pause)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val mins = elapsedSeconds / 60
            val secs = elapsedSeconds % 60
            val timeText = String.format("%02d:%02d", mins, secs)

            Column {
                Text("TIME ELAPSED", style = MaterialTheme.typography.labelSmall, color = ZenTealPrimary)
                Text(timeText, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            }

            IconButton(
                onClick = onTogglePause,
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(if (isDark) ZenDarkCard else ZenLightCard)
            ) {
                Icon(
                    imageVector = if (isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                    contentDescription = if (isPaused) "Resume" else "Pause"
                )
            }
        }

        // Live Liquid Bowl
        Box(contentAlignment = Alignment.Center) {
            WaterBowlCanvas(
                pitch = sensorEngine.pitch,
                roll = sensorEngine.roll,
                waterRemaining = sensorEngine.waterRemaining,
                isSpilling = sensorEngine.isSpilling,
                modifier = Modifier.size(280.dp)
            )

            if (sensorEngine.isSpilling) {
                Surface(
                    color = ZenSpillCrimson.copy(alpha = 0.85f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.align(Alignment.TopCenter)
                ) {
                    Text(
                        text = "SPILLING!",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // Metrics Card (Water Remaining, Steps, Cadence)
        NeuCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("WATER", style = MaterialTheme.typography.labelSmall, color = ZenTealPrimary)
                    Text(
                        text = "${sensorEngine.waterRemaining.roundToInt()}%",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = if (sensorEngine.waterRemaining < 30f) ZenSpillCrimson else ZenTealPrimary
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("STEPS", style = MaterialTheme.typography.labelSmall, color = ZenTealPrimary)
                    Text(
                        text = "${sensorEngine.stepCount}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("CADENCE", style = MaterialTheme.typography.labelSmall, color = ZenTealPrimary)
                    Text(
                        text = "${sensorEngine.currentCadence} spm",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // End Walk Early Button
        OutlinedButton(
            onClick = onFinish,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Complete Walk", fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun ResultsDialog(
    waterRemaining: Float,
    steps: Int,
    cadence: Int,
    durationSec: Int,
    onPlayAgain: () -> Unit
) {
    val isDark = isSystemInDarkTheme()
    val score = ((waterRemaining * 0.6f) + (steps.coerceAtMost(100) * 0.4f)).roundToInt()

    val grade = when {
        score >= 90 -> "S"
        score >= 80 -> "A"
        score >= 65 -> "B"
        else -> "C"
    }

    Dialog(onDismissRequest = onPlayAgain) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(if (isDark) ZenDarkCard else ZenLightSurface)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Session Completed", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))

            // Grade Badge
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(ZenGoldKintsugi.copy(alpha = 0.2f))
                    .border(2.dp, ZenGoldKintsugi, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = grade,
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Black,
                    color = ZenGoldKintsugi
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Steadiness Score: $score/100",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = ZenTealPrimary
            )

            Spacer(modifier = Modifier.height(16.dp))

            NeuInset(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ResultRow("Liquid Retained", "${waterRemaining.roundToInt()}%")
                    ResultRow("Mindful Steps", "$steps")
                    ResultRow("Average Cadence", "$cadence spm")
                    ResultRow("Duration", "${durationSec / 60}m ${durationSec % 60}s")
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = onPlayAgain,
                colors = ButtonDefaults.buttonColors(containerColor = ZenTealPrimary),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Return to Bowl", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ResultRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = ZenDarkTextSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}
