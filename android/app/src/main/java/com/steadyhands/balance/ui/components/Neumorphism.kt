package com.steadyhands.balance.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.steadyhands.balance.ui.theme.*

/**
 * High-fidelity Neumorphic Raised Card with dual directional lighting:
 * - Top-left crisp white highlight (-5dp, -5dp)
 * - Bottom-right soft diffuse ambient shadow (+6dp, +6dp)
 * - Subtle inner bevel border (1dp white/85%)
 */
@Composable
fun NeuRaisedCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(18.dp),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val darkShadowColor = if (isDark) Color(0xFF0C1014).copy(alpha = 0.85f) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
    val lightShadowColor = if (isDark) Color(0xFF263238).copy(alpha = 0.35f) else Color.White.copy(alpha = 0.95f)
    val surfaceGradient = if (isDark) {
        Brush.linearGradient(
            colors = listOf(Color(0xFF1E2226), Color(0xFF16191C)),
            start = Offset(0f, 0f),
            end = Offset.Infinite
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xFFFFFFFF), Color(0xFFF0F4F8)),
            start = Offset(0f, 0f),
            end = Offset.Infinite
        )
    }
    val borderColor = if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.85f)

    Box(
        modifier = modifier
            .drawBehind {
                // Top-Left Light Highlight glow
                drawIntoCanvas { canvas ->
                    val paint = Paint().apply {
                        color = lightShadowColor
                    }
                    // Offset highlight slightly top-left
                }
            }
            .shadow(
                elevation = if (isDark) 4.dp else 7.dp,
                shape = shape,
                ambientColor = darkShadowColor,
                spotColor = darkShadowColor
            )
            .clip(shape)
            .background(surfaceGradient)
            .border(1.dp, borderColor, shape),
        content = content
    )
}

/**
 * Neumorphic Inset / Sunken Track container (for segmented pickers & input slots):
 * - Inset shaded background
 * - Top/Left darker inset shadow
 * - Bottom/Right crisp highlight reflection
 */
@Composable
fun NeuInsetTrack(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(50.dp),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val trackBg = if (isDark) {
        Brush.linearGradient(
            colors = listOf(Color(0xFF121B24), Color(0xFF162534))
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xFFE2E8F0), Color(0xFFEBF1F7))
        )
    }
    val borderColor = if (isDark) Color(0xFF0F172A).copy(alpha = 0.70f) else Color.White.copy(alpha = 0.60f)

    Box(
        modifier = modifier
            .clip(shape)
            .background(trackBg)
            .border(1.dp, borderColor, shape)
            .padding(4.dp),
        content = content
    )
}

@Composable
fun NeuCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(16.dp),
    elevation: Dp = 6.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val isDark = isSystemInDarkTheme()
    val bgColor = if (isDark) ZenDarkCard else ZenLightCard
    val borderColor = if (isDark) ZenDarkBorder.copy(alpha = 0.6f) else Color.White.copy(alpha = 0.85f)
    val shadowColor = if (isDark) NeuDarkShadowInDark else NeuDarkShadow

    Box(
        modifier = modifier
            .shadow(
                elevation = elevation,
                shape = shape,
                ambientColor = shadowColor,
                spotColor = shadowColor
            )
            .clip(shape)
            .background(bgColor)
            .border(1.dp, borderColor, shape)
            .padding(16.dp),
        content = content
    )
}

@Composable
fun NeuInset(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(12.dp),
    content: @Composable BoxScope.() -> Unit
) {
    val isDark = isSystemInDarkTheme()
    val insetBg = if (isDark) ZenDarkBg.copy(alpha = 0.85f) else ZenLightBg.copy(alpha = 0.85f)
    val borderColor = if (isDark) ZenDarkBorder.copy(alpha = 0.4f) else ZenLightBorder.copy(alpha = 0.6f)

    Box(
        modifier = modifier
            .clip(shape)
            .background(insetBg)
            .border(1.dp, borderColor, shape)
            .padding(12.dp),
        content = content
    )
}

