package com.steadyhands.balance.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.steadyhands.balance.ui.theme.*
import kotlin.math.*
import kotlin.random.Random

data class SplashDroplet(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    var radius: Float,
    var alpha: Float
)

@Composable
fun WaterBowlCanvas(
    pitch: Float,
    roll: Float,
    waterRemaining: Float,
    isSpilling: Boolean,
    modifier: Modifier = Modifier.size(280.dp)
) {
    val isDark = resolveIsDarkTheme()

    // Smooth physics lerp
    val animatedPitch by animateFloatAsState(
        targetValue = pitch.coerceIn(-30f, 30f),
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "pitch"
    )
    val animatedRoll by animateFloatAsState(
        targetValue = roll.coerceIn(-30f, 30f),
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "roll"
    )

    // Infinite wave phase for gentle fluid idle motion
    val infiniteTransition = rememberInfiniteTransition(label = "waterIdle")
    val wavePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2 * Math.PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wavePhase"
    )

    // Splash particle state
    val droplets = remember { mutableStateListOf<SplashDroplet>() }

    LaunchedEffect(isSpilling, animatedPitch, animatedRoll) {
        if (isSpilling && droplets.size < 24) {
            val angle = atan2(animatedPitch.toDouble(), animatedRoll.toDouble()).toFloat()
            for (i in 0..2) {
                droplets.add(
                    SplashDroplet(
                        x = cos(angle) * 110f,
                        y = sin(angle) * 110f,
                        vx = (cos(angle) + (Random.nextFloat() - 0.5f) * 0.6f) * (6f + Random.nextFloat() * 6f),
                        vy = (sin(angle) + (Random.nextFloat() - 0.5f) * 0.6f) * (6f + Random.nextFloat() * 6f),
                        radius = 3f + Random.nextFloat() * 4f,
                        alpha = 0.9f
                    )
                )
            }
        }
    }

    // Tick droplets
    LaunchedEffect(wavePhase) {
        val iterator = droplets.iterator()
        while (iterator.hasNext()) {
            val d = iterator.next()
            d.x += d.vx
            d.y += d.vy
            d.alpha -= 0.05f
            if (d.alpha <= 0f) {
                iterator.remove()
            }
        }
    }

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val outerRadius = size.minDimension / 2f - 12.dp.toPx()
            val bowlInnerRadius = outerRadius - 16.dp.toPx()

            // 1. Bowl Ceramic Outer Rim (Radial Shadow & Highlight)
            val rimColor1 = if (isDark) Color(0xFF263238) else Color(0xFFECEFF1)
            val rimColor2 = if (isDark) Color(0xFF192227) else Color(0xFFCFD8DC)

            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(rimColor1, rimColor2),
                    center = center - Offset(outerRadius * 0.2f, outerRadius * 0.2f),
                    radius = outerRadius
                ),
                radius = outerRadius,
                center = center
            )

            // Outer ceramic rim border
            drawCircle(
                color = if (isDark) ZenDarkBorder else ZenLightBorder,
                radius = outerRadius,
                center = center,
                style = Stroke(width = 2.dp.toPx())
            )

            // Golden Kintsugi vein accent
            val kintsugiPath = Path().apply {
                moveTo(center.x - outerRadius * 0.7f, center.y - outerRadius * 0.5f)
                lineTo(center.x - outerRadius * 0.4f, center.y - outerRadius * 0.2f)
                lineTo(center.x - outerRadius * 0.45f, center.y + outerRadius * 0.1f)
                lineTo(center.x - outerRadius * 0.15f, center.y + outerRadius * 0.4f)
            }
            drawPath(
                path = kintsugiPath,
                color = ZenGoldKintsugi.copy(alpha = 0.65f),
                style = Stroke(width = 1.5.dp.toPx(), cap = StrokeCap.Round)
            )

            // 2. Bowl Interior Cavity
            val cavityBg = if (isDark) Color(0xFF0C1318) else Color(0xFFDCE5EB)
            drawCircle(
                color = cavityBg,
                radius = bowlInnerRadius,
                center = center
            )

            // Safe Zone Target Ring (concentric guide)
            val safeZoneRadius = bowlInnerRadius * 0.55f
            val safeRingColor = when {
                isSpilling -> ZenSpillCrimson
                sqrt(animatedPitch * animatedPitch + animatedRoll * animatedRoll) > 7f -> ZenWarningAmber
                else -> ZenTealLight.copy(alpha = 0.4f)
            }
            drawCircle(
                color = safeRingColor,
                radius = safeZoneRadius,
                center = center,
                style = Stroke(
                    width = 1.5.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f, 10f), 0f)
                )
            )

            // 3. Dynamic Water Surface with Physics Offset
            if (waterRemaining > 0f) {
                val maxOffset = bowlInnerRadius * 0.35f
                val waterOffsetX = (-animatedRoll / 30f) * maxOffset
                val waterOffsetY = (animatedPitch / 30f) * maxOffset
                val waterCenter = center + Offset(waterOffsetX, waterOffsetY)
                val waterRadius = (bowlInnerRadius * 0.88f) * (waterRemaining / 100f)

                // Water gradient
                val waterGradient = Brush.radialGradient(
                    colors = listOf(
                        ZenCyanRipple.copy(alpha = 0.85f),
                        ZenTealPrimary.copy(alpha = 0.90f),
                        ZenTealDark.copy(alpha = 0.98f)
                    ),
                    center = waterCenter - Offset(waterRadius * 0.3f, waterRadius * 0.3f),
                    radius = waterRadius
                )

                // Draw Water Meniscus
                drawCircle(
                    brush = waterGradient,
                    radius = waterRadius,
                    center = waterCenter
                )

                // Surface wave / ripples
                val rippleRadius = waterRadius * 0.6f + sin(wavePhase) * 6f
                drawCircle(
                    color = Color.White.copy(alpha = 0.25f),
                    radius = rippleRadius.coerceAtLeast(4f),
                    center = waterCenter,
                    style = Stroke(width = 1.2.dp.toPx())
                )

                // Highlight gloss reflection
                drawArc(
                    color = Color.White.copy(alpha = 0.45f),
                    startAngle = 200f,
                    sweepAngle = 70f,
                    useCenter = false,
                    topLeft = Offset(waterCenter.x - waterRadius * 0.75f, waterCenter.y - waterRadius * 0.75f),
                    size = Size(waterRadius * 1.5f, waterRadius * 1.5f),
                    style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                )
            }

            // 4. Splashing Droplets
            droplets.forEach { d ->
                drawCircle(
                    color = ZenCyanRipple.copy(alpha = d.alpha),
                    radius = d.radius,
                    center = center + Offset(d.x, d.y)
                )
            }
        }
    }
}
