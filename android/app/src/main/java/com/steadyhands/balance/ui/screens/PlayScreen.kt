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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import com.steadyhands.balance.sensor.SensorFusionEngine
import com.steadyhands.balance.ui.components.*
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
    onOpenTutorial: () -> Unit,
    onGameActiveChanged: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current
    val vibrator = remember { context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator }
    val isDark = isSystemInDarkTheme()

    var sessionState by remember { mutableStateOf(SessionState.LOBBY) }
    var selectedDifficulty by remember { mutableStateOf("medium") }
    var selectedDurationSec by remember { mutableIntStateOf(60) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }
    var calibrationCount by remember { mutableIntStateOf(3) }

    LaunchedEffect(sessionState) {
        onGameActiveChanged(sessionState != SessionState.LOBBY)
    }

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
                if (selectedDurationSec > 0 && elapsedSeconds >= selectedDurationSec) {
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
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        when (sessionState) {
            SessionState.LOBBY -> {
                LobbyView(
                    selectedDifficulty = selectedDifficulty,
                    onSelectDifficulty = { selectedDifficulty = it },
                    selectedDurationSec = selectedDurationSec,
                    onSelectDurationSec = { selectedDurationSec = it },
                    onStart = { sessionState = SessionState.CALIBRATING }
                )
            }
            SessionState.CALIBRATING -> {
                CalibratingView(countdown = calibrationCount)
            }
            SessionState.ACTIVE, SessionState.PAUSED -> {
                ActiveSessionView(
                    sensorEngine = sensorEngine,
                    elapsedSeconds = elapsedSeconds,
                    totalSeconds = selectedDurationSec,
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
    selectedDifficulty: String,
    onSelectDifficulty: (String) -> Unit,
    selectedDurationSec: Int,
    onSelectDurationSec: (Int) -> Unit,
    onStart: () -> Unit
) {
    val recordScore = when (selectedDifficulty.lowercase()) {
        "easy" -> 99
        "medium" -> 99
        "hard" -> 95
        else -> 99
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .widthIn(max = 420.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Best Steadiness Record Card
        HomeRecordCard(
            difficulty = selectedDifficulty,
            recordScore = recordScore
        )

        // 2. Collapsible Mindful Health Card with Sequential Carousel
        MindfulCarouselCard()

        // 3. Center Stylish Start Button with Ambient Glow & Rotating Orbit
        StartButtonOrbit(
            durationSec = selectedDurationSec,
            difficulty = selectedDifficulty,
            onStartClick = onStart,
            modifier = Modifier.padding(vertical = 4.dp)
        )

        // 4. Difficulty Selector (Easy, Medium, Hard)
        DifficultySelector(
            selectedDifficulty = selectedDifficulty,
            onSelectDifficulty = onSelectDifficulty
        )

        // 5. Duration Selector (45s, 60s, 90s)
        DurationSelector(
            selectedDurationSec = selectedDurationSec,
            onSelectDurationSec = onSelectDurationSec
        )

        // 6. AdMob Banner Placement Preview
        AdMimicCard()

        Spacer(modifier = Modifier.height(24.dp))
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
