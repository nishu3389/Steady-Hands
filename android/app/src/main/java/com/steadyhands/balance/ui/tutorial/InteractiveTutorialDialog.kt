package com.steadyhands.balance.ui.tutorial

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.R
import com.steadyhands.balance.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.*

private const val PREFS_NAME = "steady_hands_prefs"
private const val KEY_TUTORIAL_SEEN = "tutorial_seen"

private data class TutorialStepSpec(
    val tagline: String,
    val title: String
)

// Mirrors web's tutorialSteps (src/components/InteractiveTutorialModal.tsx) exactly.
private val tutorialStepSpecs = listOf(
    TutorialStepSpec("Step 1 of 4 • Calibration", "Stand Still & Center the Dot to Calibrate"),
    TutorialStepSpec("Step 2 of 4 • Mindful Stride", "Start Walking Steadily to Keep the Timer Moving"),
    TutorialStepSpec("Step 3 of 4 • Spill Prevention", "Keep Hands Steady — Don't Shake or Spill Water"),
    TutorialStepSpec("Step 4 of 4 • Victory", "Finish 60 Seconds with 50%+ Water to Win!")
)

@Composable
fun InteractiveTutorialDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val isDark = resolveIsDarkTheme()
    val pagerState = rememberPagerState(pageCount = { 4 })
    val coroutineScope = rememberCoroutineScope()

    // Web marks the tutorial seen the moment it's closed, by any path
    // (Skip, X, or completing the last step) — there's no separate opt-out.
    val dismissAndMarkSeen: () -> Unit = {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_TUTORIAL_SEEN, true)
            .apply()
        onDismiss()
    }

    BackHandler(onBack = dismissAndMarkSeen)

    val bgColor = if (isDark) CanvasBgDark else CanvasBgLight
    val cardBg = if (isDark) ZenDarkCard else ZenLightSurface
    val borderColor = if (isDark) ZenDarkBorder else ZenLightBorder

    // A full-screen in-place overlay (mirrors the web's fixed-position
    // overlay div) rather than a platform Dialog window — avoids Android
    // Dialog windows' translucent-surface compositing bleeding the screen
    // behind through the "opaque" background.
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(bgColor)
            .padding(horizontal = 20.dp, vertical = 28.dp)
    ) {
            // Header: "Interactive Guide" / "How to Play" + Skip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = "INTERACTIVE GUIDE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = if (isDark) BrandBlueDark else BrandBluePrimary
                    )
                    Text(
                        text = "How to Play",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) TextPrimaryDark else TextPrimaryLight
                    )
                }

                TextButton(onClick = dismissAndMarkSeen) {
                    Text(
                        text = "Skip",
                        color = if (isDark) TextSecondaryDark else TextSecondaryLight,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        painter = painterResource(id = R.drawable.ic_lucide_x),
                        contentDescription = "Close",
                        tint = if (isDark) TextSecondaryDark else TextSecondaryLight,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress dots: current = wide blue, completed = emerald, upcoming = gray
            Row(horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxWidth()) {
                for (i in 0 until 4) {
                    val isCurrent = pagerState.currentPage == i
                    val isCompleted = i < pagerState.currentPage
                    val width by animateDpAsState(
                        targetValue = if (isCurrent) 28.dp else 8.dp,
                        animationSpec = spring(stiffness = Spring.StiffnessMedium),
                        label = "dotWidth"
                    )
                    val color = when {
                        isCurrent -> if (isDark) BrandBlueDark else BrandBluePrimary
                        isCompleted -> ZenSuccessEmerald
                        else -> if (isDark) ZenDarkBorder else ZenLightBorder
                    }

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

            Spacer(modifier = Modifier.height(20.dp))

            // Illustration + tagline + title card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .shadow(12.dp, RoundedCornerShape(28.dp))
                    .clip(RoundedCornerShape(28.dp))
                    .background(cardBg)
                    .border(1.dp, borderColor, RoundedCornerShape(28.dp))
                    .padding(vertical = 24.dp, horizontal = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) { page ->
                    when (page) {
                        0 -> TutorialStepCalibration(isDark)
                        1 -> TutorialStepMindfulStride(isDark)
                        2 -> TutorialStepSpillPrevention(isDark)
                        3 -> TutorialStepVictory(isDark)
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                val spec = tutorialStepSpecs[pagerState.currentPage]
                Text(
                    text = spec.tagline.uppercase(),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    color = if (isDark) BrandBlueDark else BrandBluePrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = spec.title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    color = if (isDark) TextPrimaryDark else TextPrimaryLight,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Footer: Back (from step 2 onward) + primary action
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
                        Icon(
                            painter = painterResource(id = R.drawable.ic_lucide_chevron_left),
                            contentDescription = null,
                            tint = if (isDark) TextSecondaryDark else TextSecondaryLight,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Back", color = if (isDark) TextSecondaryDark else TextSecondaryLight)
                    }
                } else {
                    Spacer(modifier = Modifier.width(1.dp))
                }

                val isLastStep = pagerState.currentPage == 3
                Button(
                    onClick = {
                        if (!isLastStep) {
                            coroutineScope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        } else {
                            dismissAndMarkSeen()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isDark) BrandBlueDark else BrandBluePrimary,
                        contentColor = if (isDark) Color(0xFF003258) else Color.White
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = if (isLastStep) "Start 60s Walk" else "Next Step",
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.3.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Icon(
                        painter = painterResource(
                            id = if (isLastStep) R.drawable.ic_lucide_play else R.drawable.ic_lucide_chevron_right
                        ),
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
}

@Composable
private fun TutorialBadge(text: String, color: Color, iconRes: Int) {
    Surface(
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(13.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = text,
                color = color,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.3.sp
            )
        }
    }
}

// STEP 1: Calibration — dot glides to center of a compass ring and settles.
@Composable
private fun TutorialStepCalibration(isDark: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "calibration")
    val settle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "settle"
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(modifier = Modifier.size(150.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radius = size.minDimension / 2f - 6.dp.toPx()

                drawCircle(
                    color = ZenSuccessEmerald.copy(alpha = 0.35f),
                    radius = radius,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx())
                )
                drawLine(
                    color = ZenSuccessEmerald.copy(alpha = 0.25f),
                    start = Offset(center.x - radius * 0.7f, center.y),
                    end = Offset(center.x + radius * 0.7f, center.y),
                    strokeWidth = 1.5.dp.toPx()
                )
                drawLine(
                    color = ZenSuccessEmerald.copy(alpha = 0.25f),
                    start = Offset(center.x, center.y - radius * 0.7f),
                    end = Offset(center.x, center.y + radius * 0.7f),
                    strokeWidth = 1.5.dp.toPx()
                )

                // Dot drifts in from off-center and settles at the middle.
                val drift = (1f - settle) * 34f
                val dotCenter = center + Offset(drift, drift * 0.4f)
                drawCircle(color = ZenSuccessEmerald, radius = 10.dp.toPx(), center = dotCenter)
                if (settle > 0.85f) {
                    drawCircle(
                        color = ZenSuccessEmerald.copy(alpha = (settle - 0.85f) * 2f),
                        radius = 18.dp.toPx(),
                        center = dotCenter,
                        style = Stroke(width = 2.dp.toPx())
                    )
                }
            }

            Icon(
                painter = painterResource(id = R.drawable.ic_lucide_compass),
                contentDescription = null,
                tint = if (isDark) TextPrimaryDark else TextPrimaryLight,
                modifier = Modifier.size(34.dp)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))
        TutorialBadge("CENTER TO CALIBRATE", ZenSuccessEmerald, R.drawable.ic_lucide_compass)
    }
}

// STEP 2: Mindful Stride — steady walking cadence with a bouncing footprints badge.
@Composable
private fun TutorialStepMindfulStride(isDark: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "stride")
    val cadence by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1100, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "cadence"
    )
    val bounce by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -6f,
        animationSpec = infiniteRepeatable(
            animation = tween(400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bounce"
    )

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(modifier = Modifier.size(150.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val centerY = size.height / 2f
                val width = size.width

                val wavePath = Path().apply {
                    moveTo(10f, centerY)
                    var x = 10f
                    while (x <= width - 10f) {
                        val y = centerY + sin((x / 22f) + cadence * 2 * PI).toFloat() * 20f
                        lineTo(x, y)
                        x += 4f
                    }
                }
                drawPath(
                    path = wavePath,
                    color = if (isDark) BrandBlueDark else BrandBluePrimary,
                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                )

                val leftAlpha = ((sin(cadence * 2 * PI) + 1f) / 2f).toFloat()
                drawCircle(
                    color = ZenTealPrimary.copy(alpha = leftAlpha * 0.8f),
                    radius = 11.dp.toPx(),
                    center = Offset(width * 0.32f, centerY - 26f)
                )
                drawCircle(
                    color = ZenTealPrimary.copy(alpha = (1f - leftAlpha) * 0.8f),
                    radius = 11.dp.toPx(),
                    center = Offset(width * 0.68f, centerY + 26f)
                )
            }

            Icon(
                painter = painterResource(id = R.drawable.ic_lucide_footprints),
                contentDescription = null,
                tint = if (isDark) TextPrimaryDark else TextPrimaryLight,
                modifier = Modifier
                    .size(32.dp)
                    .offset(y = bounce.dp)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))
        TutorialBadge("WALKING ACTIVE • 54 SPM", if (isDark) BrandBlueDark else BrandBluePrimary, R.drawable.ic_lucide_footprints)
    }
}

// STEP 3: Spill Prevention — alternates between the "don't" and "do" state every 3s.
@Composable
private fun TutorialStepSpillPrevention(isDark: Boolean) {
    var showDanger by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(3000)
            showDanger = !showDanger
        }
    }

    val badgeColor = if (showDanger) ZenSpillCrimson else ZenSuccessEmerald
    val ringColor by animateColorAsState(targetValue = badgeColor, label = "ringColor")

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(modifier = Modifier.size(150.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radius = size.minDimension / 2f - 8.dp.toPx()
                drawCircle(
                    color = ringColor,
                    radius = radius,
                    center = center,
                    style = Stroke(
                        width = 3.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f), 0f)
                    )
                )
                drawCircle(color = ringColor.copy(alpha = 0.15f), radius = radius * 0.55f, center = center)
            }

            Icon(
                painter = painterResource(
                    id = if (showDanger) R.drawable.ic_lucide_alert_triangle else R.drawable.ic_lucide_check_circle_2
                ),
                contentDescription = null,
                tint = ringColor,
                modifier = Modifier.size(36.dp)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))
        if (showDanger) {
            TutorialBadge("DON'T TILT • WATER SPILLS", ZenSpillCrimson, R.drawable.ic_lucide_alert_triangle)
        } else {
            TutorialBadge("DO THIS • KEEP STEADY", ZenSuccessEmerald, R.drawable.ic_lucide_check_circle_2)
        }
    }
}

// STEP 4: Victory — trophy glow with a small confetti burst.
@Composable
private fun TutorialStepVictory(isDark: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "victory")
    val glow by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow"
    )
    val confettiOffsets = remember {
        listOf(
            Offset(-46f, -30f), Offset(48f, -22f), Offset(-30f, 34f),
            Offset(36f, 30f), Offset(0f, -44f), Offset(-52f, 6f)
        )
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(modifier = Modifier.size(150.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                drawCircle(
                    color = ZenGoldKintsugi.copy(alpha = 0.25f * glow),
                    radius = size.minDimension / 2f * glow,
                    center = center
                )
                confettiOffsets.forEachIndexed { index, offset ->
                    val color = if (index % 2 == 0) ZenGoldKintsugi else (if (isDark) BrandBlueDark else BrandBluePrimary)
                    drawCircle(color = color, radius = 3.dp.toPx(), center = center + offset)
                }
            }

            Icon(
                painter = painterResource(id = R.drawable.ic_lucide_trophy),
                contentDescription = null,
                tint = ZenGoldKintsugi,
                modifier = Modifier.size(44.dp)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))
        TutorialBadge("VICTORY! 50%+ WATER SAVED", ZenWarningAmber, R.drawable.ic_lucide_trophy)
    }
}
