package com.steadyhands.balance.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun StartButtonOrbit(
    durationSec: Int,
    difficulty: String,
    onStartClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Smooth continuous rotations
    val infiniteTransition = rememberInfiniteTransition(label = "orbitRotation")

    val orbitAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "orbitAngle"
    )

    val reverseOrbitAngle by infiniteTransition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(18000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "reverseOrbitAngle"
    )

    val pulseGlow by infiniteTransition.animateFloat(
        initialValue = 0.75f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseGlow"
    )

    val scale = if (isPressed) 0.95f else 1.0f

    Box(
        modifier = modifier
            .size(230.dp)
            .padding(4.dp),
        contentAlignment = Alignment.Center
    ) {
        // Ambient Radiant Glow Behind Button
        Box(
            modifier = Modifier
                .size(210.dp)
                .scale(pulseGlow)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            if (isDark) OrbitBlue.copy(alpha = 0.45f) else OrbitBlue.copy(alpha = 0.28f),
                            if (isDark) OrbitCyan.copy(alpha = 0.35f) else OrbitCyan.copy(alpha = 0.20f),
                            if (isDark) OrbitAmber.copy(alpha = 0.25f) else OrbitAmber.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        // Canvas for Rotating Primary and Secondary Orbit Rings + Satellite Particles
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val primaryRadius = (size.minDimension / 2f) - 14.dp.toPx()
            val secondaryRadius = primaryRadius - 18.dp.toPx()

            // 1. Primary Orbit Ring with dash pattern and sweep gradient
            rotate(orbitAngle, pivot = center) {
                val orbitBrush = Brush.sweepGradient(
                    colors = listOf(
                        OrbitBlue,
                        OrbitCyan,
                        OrbitAmber,
                        OrbitBlue
                    ),
                    center = center
                )

                drawCircle(
                    brush = orbitBrush,
                    radius = primaryRadius,
                    center = center,
                    style = Stroke(
                        width = 2.dp.toPx(),
                        cap = StrokeCap.Round,
                        pathEffect = PathEffect.dashPathEffect(
                            floatArrayOf(28f, 20f, 56f, 16f),
                            0f
                        )
                    ),
                    alpha = 0.85f
                )

                // Satellite Particle 1: Cyan dot with glow
                val rad1 = Math.toRadians(0.0)
                val dot1X = center.x + primaryRadius * cos(rad1).toFloat()
                val dot1Y = center.y + primaryRadius * sin(rad1).toFloat()
                drawCircle(
                    color = OrbitCyan.copy(alpha = 0.35f),
                    radius = 9.dp.toPx(),
                    center = Offset(dot1X, dot1Y)
                )
                drawCircle(
                    color = OrbitCyan,
                    radius = 5.dp.toPx(),
                    center = Offset(dot1X, dot1Y)
                )

                // Satellite Particle 2: Amber dot with glow
                val rad2 = Math.toRadians(180.0)
                val dot2X = center.x + primaryRadius * cos(rad2).toFloat()
                val dot2Y = center.y + primaryRadius * sin(rad2).toFloat()
                drawCircle(
                    color = OrbitAmber.copy(alpha = 0.35f),
                    radius = 7.dp.toPx(),
                    center = Offset(dot2X, dot2Y)
                )
                drawCircle(
                    color = OrbitAmber,
                    radius = 4.dp.toPx(),
                    center = Offset(dot2X, dot2Y)
                )
            }

            // 2. Secondary Counter-Rotating Accent Ring
            rotate(reverseOrbitAngle, pivot = center) {
                drawCircle(
                    color = if (isDark) BrandBlueDark.copy(alpha = 0.30f) else BrandBluePrimary.copy(alpha = 0.25f),
                    radius = secondaryRadius,
                    center = center,
                    style = Stroke(
                        width = 1.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(
                            floatArrayOf(12f, 12f),
                            0f
                        )
                    )
                )
            }
        }

        // Center Interactive Start Button (~150dp) with dual neumorphic shadow and gradient
        val buttonGradient = if (isDark) {
            Brush.linearGradient(
                colors = listOf(Color(0xFF262B30), Color(0xFF16191C)),
                start = Offset(0f, 0f),
                end = Offset(250f, 250f)
            )
        } else {
            Brush.linearGradient(
                colors = listOf(Color(0xFFFFFFFF), Color(0xFFEFF3F8)),
                start = Offset(0f, 0f),
                end = Offset(250f, 250f)
            )
        }

        Box(
            modifier = Modifier
                .size(152.dp)
                .scale(scale)
                .shadow(
                    elevation = if (isDark) 10.dp else 14.dp,
                    shape = CircleShape,
                    ambientColor = if (isDark) Color(0xFF040608) else Color(0xFFA3B1C6).copy(alpha = 0.60f),
                    spotColor = if (isDark) Color(0xFF040608) else Color(0xFFA3B1C6).copy(alpha = 0.60f)
                )
                .clip(CircleShape)
                .background(buttonGradient)
                .border(
                    width = 1.5.dp,
                    color = if (isDark) Color.White.copy(alpha = 0.12f) else Color.White.copy(alpha = 0.95f),
                    shape = CircleShape
                )
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    onClick = onStartClick
                ),
            contentAlignment = Alignment.Center
        ) {
            // Subtle Inner Concentric Ring
            Box(
                modifier = Modifier
                    .size(134.dp)
                    .clip(CircleShape)
                    .border(
                        width = 1.dp,
                        color = if (isDark) BrandBlueDark.copy(alpha = 0.18f) else BrandBluePrimary.copy(alpha = 0.14f),
                        shape = CircleShape
                    )
            )

            // Button Contents (Play Badge, START text, duration · difficulty)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(8.dp)
            ) {
                // Play Icon Badge (42dp) with inset / shadow styling
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(
                            if (isDark) {
                                Brush.linearGradient(
                                    colors = listOf(Color(0xFF00558F).copy(alpha = 0.35f), Color(0xFF003D69).copy(alpha = 0.20f))
                                )
                            } else {
                                Brush.linearGradient(
                                    colors = listOf(Color(0xFFD6E8FC), Color(0xFFE8F2FD))
                                )
                            }
                        )
                        .border(
                            width = 1.dp,
                            color = if (isDark) BrandBlueDark.copy(alpha = 0.25f) else BrandBluePrimary.copy(alpha = 0.15f),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Start",
                        tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                        modifier = Modifier
                            .size(22.dp)
                            .offset(x = 1.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // "START" Text
                Text(
                    text = "START",
                    fontSize = 19.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 2.sp,
                    color = if (isDark) BrandBlueDark else BrandBluePrimary
                )

                Spacer(modifier = Modifier.height(1.dp))

                // "60S · MEDIUM"
                Text(
                    text = "${durationSec}S · ${difficulty.uppercase()}",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    color = if (isDark) TextMutedDark else TextMutedLight
                )
            }
        }
    }
}
