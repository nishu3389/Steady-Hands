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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.BlurredEdgeTreatment
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.util.lerp
import com.steadyhands.balance.R
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

    // Matches the web's `animate-pulse-glow` keyframes: 0%/100% -> scale 1,
    // opacity 0.6; 50% -> scale 1.08, opacity 0.95; 3.5s ease-in-out, so a
    // 1750ms tween that reverses covers one full up/down cycle in 3.5s.
    val glowProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1750, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowProgress"
    )
    val glowScale = lerp(1f, 1.08f, glowProgress)
    val glowAlpha = lerp(0.6f, 0.95f, glowProgress)

    val scale = if (isPressed) 0.95f else 1.0f

    Box(
        modifier = modifier
            .size(230.dp)
            .padding(4.dp),
        contentAlignment = Alignment.Center
    ) {
        // Ambient Radiant Glow Behind Button — a soft, mostly-white/blue
        // bloom hugging the dial closely (matching the web reference, which
        // is subtle and barely tinted, not a large saturated wash). Sized
        // only modestly bigger than the 230dp ring container so it reads as
        // a halo, not a colored rectangle behind the whole section.
        val glowFrom = if (isDark) Color(0xFF0078C6).copy(alpha = 0.28f) else Color(0xFF005F9E).copy(alpha = 0.20f)
        val glowVia = if (isDark) Color(0xFF38BDF8).copy(alpha = 0.20f) else Color(0xFF00A8FF).copy(alpha = 0.14f)
        val glowTo = if (isDark) Color(0xFFFBBF24).copy(alpha = 0.14f) else Color(0xFFF59E0B).copy(alpha = 0.09f)

        Box(
            modifier = Modifier
                // `size()` clamps to the parent's incoming max constraints
                // (this composable's own outer Box is fixed at 230dp), so a
                // plain `.size(400.dp)` here gets silently shrunk back down
                // to 230dp. `requiredSize` ignores incoming constraints
                // entirely, which is what actually lets this be bigger than
                // its own parent.
                .requiredSize(300.dp)
                .graphicsLayer {
                    scaleX = glowScale
                    scaleY = glowScale
                    alpha = glowAlpha
                }
                // `blur()` defaults to BlurredEdgeTreatment.Rectangle, which
                // clips the blur exactly at this box's own layout bounds —
                // Unbounded lets it feather out past the box instead of
                // being cut off at a hard border.
                .blur(16.dp, edgeTreatment = BlurredEdgeTreatment.Unbounded)
                .drawWithCache {
                    // Gradient center matches the drawn circle's own center
                    // exactly (previously offset from it, which made the
                    // color denser on one side and the bloom read as
                    // lopsided/oval rather than a true circle) — fully faded
                    // to transparent well inside the radius on every side.
                    val boxCenter = Offset(size.width / 2f, size.height / 2f)
                    val brush = Brush.radialGradient(
                        colorStops = arrayOf(
                            0f to glowFrom,
                            0.40f to glowVia,
                            0.65f to glowTo,
                            1f to Color.Transparent
                        ),
                        center = boxCenter,
                        radius = size.minDimension * 0.5f
                    )
                    onDrawBehind {
                        drawCircle(brush = brush, radius = size.minDimension / 2f, center = center)
                    }
                }
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

        // Center Interactive Start Button (~152dp) with card-raised neumorphic shadow and crisp white face
        val buttonBg = if (isDark) Color(0xFF191C1E) else Color.White

        Box(
            modifier = Modifier
                .size(152.dp)
                .scale(scale)
                .shadow(
                    elevation = if (isDark) 10.dp else 14.dp,
                    shape = CircleShape,
                    ambientColor = if (isDark) Color(0xFF040608) else Color(0xFFA3B1C6).copy(alpha = 0.50f),
                    spotColor = if (isDark) Color(0xFF040608) else Color(0xFFA3B1C6).copy(alpha = 0.50f)
                )
                .clip(CircleShape)
                .background(buttonBg)
                .border(
                    width = 1.2.dp,
                    color = if (isDark) Color.White.copy(alpha = 0.10f) else Color.White.copy(alpha = 0.95f),
                    shape = CircleShape
                )
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    onClick = onStartClick
                ),
            contentAlignment = Alignment.Center
        ) {
            // Subtle Inner Concentric Ring (matches web inset-2.5)
            Box(
                modifier = Modifier
                    .size(132.dp)
                    .clip(CircleShape)
                    .border(
                        width = 1.dp,
                        color = if (isDark) Color(0xFF9DCAFF).copy(alpha = 0.15f) else BrandBluePrimary.copy(alpha = 0.15f),
                        shape = CircleShape
                    )
            )

            // Button Contents (Play Badge, START text, duration · difficulty)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(6.dp)
            ) {
                // Play Icon Badge (40dp) with soft blue tint (bg-[#005f9e]/10)
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(
                            if (isDark) Color(0xFF9DCAFF).copy(alpha = 0.15f) else BrandBluePrimary.copy(alpha = 0.10f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_lucide_play),
                        contentDescription = "Start",
                        tint = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary,
                        modifier = Modifier
                            .size(18.dp)
                            .offset(x = 1.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // "START" Text (20sp, font weight 800, tracking 0.16em)
                Text(
                    text = "START",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 3.2.sp,
                    color = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary
                )

                Spacer(modifier = Modifier.height(2.dp))

                // "60S · MEDIUM" (9sp, bold, tracking 0.12em)
                Text(
                    text = "${durationSec}S · ${difficulty.uppercase()}",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp,
                    color = if (isDark) Color(0xFFA0A8B4) else Color(0xFF707882)
                )
            }
        }
    }
}
