package com.steadyhands.balance.ui.tutorial

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.steadyhands.balance.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.*

private const val PREFS_NAME = "steady_hands_prefs"
private const val KEY_TUTORIAL_SEEN = "tutorial_seen"

@Composable
fun InteractiveTutorialDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE) }
    var dontShowAgain by remember { mutableStateOf(false) }

    val pagerState = rememberPagerState(pageCount = { 4 })
    val coroutineScope = rememberCoroutineScope()
    val isDark = isSystemInDarkTheme()

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.65f))
                .padding(20.dp),
            contentAlignment = Alignment.Center
        ) {
            val cardBg = if (isDark) ZenDarkCard else ZenLightSurface
            val borderColor = if (isDark) ZenDarkBorder else ZenLightBorder

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight()
                    .shadow(16.dp, RoundedCornerShape(24.dp))
                    .clip(RoundedCornerShape(24.dp))
                    .background(cardBg)
                    .border(1.dp, borderColor, RoundedCornerShape(24.dp))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header with Step count and Close button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Step ${pagerState.currentPage + 1} of 4",
                        style = MaterialTheme.typography.labelSmall,
                        color = ZenTealPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Carousel Pager
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(340.dp)
                ) { page ->
                    when (page) {
                        0 -> TutorialStepOneHoldFlat()
                        1 -> TutorialStepTwoMindfulWalking()
                        2 -> TutorialStepThreeSafeZone()
                        3 -> TutorialStepFourCalmWaves()
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Animated Pill Step Indicators
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    for (i in 0 until 4) {
                        val isSelected = pagerState.currentPage == i
                        val width by animateDpAsState(
                            targetValue = if (isSelected) 24.dp else 8.dp,
                            animationSpec = spring(stiffness = Spring.StiffnessMedium),
                            label = "indicatorWidth"
                        )
                        val color = if (isSelected) ZenTealPrimary else (if (isDark) ZenDarkBorder else ZenLightBorder)

                        Box(
                            modifier = Modifier
                                .padding(horizontal = 4.dp)
                                .height(8.dp)
                                .width(width)
                                .clip(CircleShape)
                                .background(color)
                                .clickable {
                                    coroutineScope.launch { pagerState.animateScrollToPage(i) }
                                }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Don't show again checkbox
                Row(
                    modifier = Modifier
                        .clickable {
                            dontShowAgain = !dontShowAgain
                            prefs.edit().putBoolean(KEY_TUTORIAL_SEEN, dontShowAgain).apply()
                        }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = dontShowAgain,
                        onCheckedChange = { checked ->
                            dontShowAgain = checked
                            prefs.edit().putBoolean(KEY_TUTORIAL_SEEN, checked).apply()
                        },
                        colors = CheckboxDefaults.colors(checkedColor = ZenTealPrimary)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Don't show this again",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Navigation Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (pagerState.currentPage > 0) {
                        TextButton(
                            onClick = {
                                coroutineScope.launch {
                                    pagerState.animateScrollToPage(pagerState.currentPage - 1)
                                }
                            }
                        ) {
                            Text("Back", color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary)
                        }
                    } else {
                        TextButton(onClick = onDismiss) {
                            Text("Skip", color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary)
                        }
                    }

                    Button(
                        onClick = {
                            if (pagerState.currentPage < 3) {
                                coroutineScope.launch {
                                    pagerState.animateScrollToPage(pagerState.currentPage + 1)
                                }
                            } else {
                                onDismiss()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ZenTealPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = if (pagerState.currentPage == 3) "Got it! Let's Walk" else "Next",
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}

// STEP 1: Phone Leveling & Sonar Rings
@Composable
private fun TutorialStepOneHoldFlat() {
    val isDark = isSystemInDarkTheme()
    val infiniteTransition = rememberInfiniteTransition(label = "step1")

    // Gentle phone tilt oscillation
    val tiltAnim by infiniteTransition.animateFloat(
        initialValue = -8f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "phoneTilt"
    )

    // Concentric expanding sonar wave
    val waveScale by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "sonarScale"
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Box(
            modifier = Modifier
                .size(170.dp)
                .padding(10.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val baseRadius = size.minDimension / 2f

                // Expanding acoustic waves
                drawCircle(
                    color = ZenTealPrimary.copy(alpha = (1f - waveScale) * 0.4f),
                    radius = baseRadius * waveScale,
                    center = center,
                    style = Stroke(width = 2.dp.toPx())
                )

                // Leveling guide crosshair
                drawLine(
                    color = ZenTealPrimary.copy(alpha = 0.25f),
                    start = Offset(center.x - baseRadius * 0.7f, center.y),
                    end = Offset(center.x + baseRadius * 0.7f, center.y),
                    strokeWidth = 1.5.dp.toPx()
                )
                drawLine(
                    color = ZenTealPrimary.copy(alpha = 0.25f),
                    start = Offset(center.x, center.y - baseRadius * 0.7f),
                    end = Offset(center.x, center.y + baseRadius * 0.7f),
                    strokeWidth = 1.5.dp.toPx()
                )

                // Center leveling bubble drifting with tilt
                val bubbleOffset = Offset(
                    x = center.x + sin(Math.toRadians(tiltAnim.toDouble())).toFloat() * 40f,
                    y = center.y
                )
                drawCircle(
                    color = ZenTealLight,
                    radius = 10.dp.toPx(),
                    center = bubbleOffset
                )
            }

            // Phone icon in center
            Icon(
                imageVector = Icons.Default.PhoneAndroid,
                contentDescription = null,
                tint = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary,
                modifier = Modifier.size(52.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                color = ZenTealPrimary.copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "CORE TECHNIQUE",
                    color = ZenTealPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            Text(
                text = "Hold Flat & Level",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Keep your phone horizontal like a shallow tea saucer. Small tilts affect the water balance instantly.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}

// STEP 2: Mindful Walking Cadence & Pulsing Footprints
@Composable
private fun TutorialStepTwoMindfulWalking() {
    val isDark = isSystemInDarkTheme()
    val infiniteTransition = rememberInfiniteTransition(label = "step2")

    val stepPulse by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "footstepPulse"
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Box(
            modifier = Modifier
                .size(170.dp)
                .padding(10.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val width = size.width
                val height = size.height

                // Sinusoidal Cadence Graph
                val wavePath = Path().apply {
                    moveTo(10f, center.y)
                    for (x in 10..width.toInt() - 10 step 4) {
                        val xVal = x.toFloat()
                        val yVal = center.y + sin((xVal / 25f) + stepPulse * 2 * Math.PI).toFloat() * 22f
                        lineTo(xVal, yVal)
                    }
                }
                drawPath(
                    path = wavePath,
                    color = ZenCyanRipple,
                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                )

                // Rhythmic footstep markers
                val leftFootPos = Offset(width * 0.35f, center.y - 30f)
                val rightFootPos = Offset(width * 0.65f, center.y + 30f)

                val leftAlpha = ((sin(stepPulse * 2 * Math.PI) + 1f) / 2f).toFloat()
                val rightAlpha = (1f - leftAlpha)

                drawCircle(color = ZenTealPrimary.copy(alpha = leftAlpha * 0.8f), radius = 12.dp.toPx(), center = leftFootPos)
                drawCircle(color = ZenTealPrimary.copy(alpha = rightAlpha * 0.8f), radius = 12.dp.toPx(), center = rightFootPos)
            }

            Icon(
                imageVector = Icons.Default.DirectionsWalk,
                contentDescription = null,
                tint = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary,
                modifier = Modifier.size(48.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                color = ZenOceanBlue.copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "SMOOTH MOTION",
                    color = ZenOceanBlue,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            Text(
                text = "Glide, Don't Stomp",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Walk with gentle, continuous heel-to-toe strides. Aim for a calming cadence around 50 steps per minute.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}

// STEP 3: Radar Safe Zone Target
@Composable
private fun TutorialStepThreeSafeZone() {
    val isDark = isSystemInDarkTheme()
    val infiniteTransition = rememberInfiniteTransition(label = "step3")

    val dotDrift by infiniteTransition.animateFloat(
        initialValue = -25f,
        targetValue = 25f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dotDrift"
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Box(
            modifier = Modifier
                .size(170.dp)
                .padding(10.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val outerRadius = size.minDimension / 2f - 6.dp.toPx()
                val safeRadius = outerRadius * 0.55f

                // Outer Danger Ring
                drawCircle(
                    color = ZenSpillCrimson.copy(alpha = 0.25f),
                    radius = outerRadius,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx())
                )

                // Safe Zone Inner Ring
                val isSafe = abs(dotDrift) < 18f
                val ringColor = if (isSafe) ZenSuccessEmerald else ZenWarningAmber
                drawCircle(
                    color = ringColor,
                    radius = safeRadius,
                    center = center,
                    style = Stroke(
                        width = 2.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f), 0f)
                    )
                )

                // Drifting Balance Dot
                val dotCenter = center + Offset(dotDrift, sin(dotDrift / 10f) * 12f)
                drawCircle(
                    color = if (isSafe) ZenTealPrimary else ZenWarningAmber,
                    radius = 9.dp.toPx(),
                    center = dotCenter
                )
            }

            Icon(
                imageVector = Icons.Default.TrackChanges,
                contentDescription = null,
                tint = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary,
                modifier = Modifier.size(40.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                color = ZenSuccessEmerald.copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "SENSOR CALIBRATION",
                    color = ZenSuccessEmerald,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            Text(
                text = "Stay in the Safe Zone",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Keep the liquid center inside the dashed green ring. Tilting beyond 10° triggers haptics and spills water.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}

// STEP 4: Calming the Water & Zen Stillness
@Composable
private fun TutorialStepFourCalmWaves() {
    val isDark = isSystemInDarkTheme()
    val infiniteTransition = rememberInfiniteTransition(label = "step4")

    val waveDamping by infiniteTransition.animateFloat(
        initialValue = 28f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "waveDamp"
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Box(
            modifier = Modifier
                .size(170.dp)
                .padding(10.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val width = size.width

                // Calm Water Sine Wave damping
                val wavePath = Path().apply {
                    moveTo(12f, center.y)
                    for (x in 12..width.toInt() - 12 step 4) {
                        val xVal = x.toFloat()
                        val yVal = center.y + sin(xVal / 18f).toFloat() * waveDamping
                        lineTo(xVal, yVal)
                    }
                }
                drawPath(
                    path = wavePath,
                    color = ZenTealLight,
                    style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                )

                // Golden Sparkles of stillness
                if (waveDamping < 8f) {
                    val sparkleOffsets = listOf(
                        center + Offset(-40f, -25f),
                        center + Offset(45f, -20f),
                        center + Offset(10f, 30f)
                    )
                    sparkleOffsets.forEach { pos ->
                        drawCircle(color = ZenGoldKintsugi, radius = 3.5.dp.toPx(), center = pos)
                    }
                }
            }

            Icon(
                imageVector = Icons.Default.Spa,
                contentDescription = null,
                tint = ZenGoldKintsugi,
                modifier = Modifier.size(46.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                color = ZenGoldKintsugi.copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "ZEN FLOW STATE",
                    color = ZenGoldKintsugi,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            Text(
                text = "Calm the Waves",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "If water starts sloshing, pause your feet and take a slow breath. Stillness returns your bowl to zero disturbance.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}
