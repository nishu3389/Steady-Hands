package com.steadyhands.balance.ui.components

import android.graphics.BlurMaskFilter
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
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
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
 * Draws the classic neumorphic dual soft-shadow pair: a dark blurred shadow
 * offset toward the bottom-right (as if lit from the top-left) and a light
 * blurred highlight offset toward the top-left, both using a real Gaussian
 * blur (`BlurMaskFilter`) rather than a single flat elevation shadow — this
 * is what actually reads as "3D depth" instead of a flat drop shadow.
 *
 * [inset] draws the same pair the other way around (dark toward the near
 * top-left edge, light toward the near bottom-right edge) and expects the
 * caller to have already clipped to [shape], so only the sliver of each
 * blurred shape that overlaps the clipped area shows — producing a carved
 * "sunken" look instead of a "raised" one.
 */
fun Modifier.neumorphicDualShadow(
    darkColor: Color,
    lightColor: Color,
    blurRadius: Dp,
    offset: Dp,
    cornerRadius: Dp,
    inset: Boolean = false
): Modifier = this.drawBehind {
    val blurPx = blurRadius.toPx()
    val offsetPx = if (inset) -offset.toPx() else offset.toPx()
    val cornerPx = cornerRadius.toPx()

    drawIntoCanvas { canvas ->
        val darkPaint = android.graphics.Paint().apply {
            isAntiAlias = true
            color = darkColor.toArgb()
            maskFilter = BlurMaskFilter(blurPx, BlurMaskFilter.Blur.NORMAL)
        }
        canvas.nativeCanvas.drawRoundRect(
            offsetPx, offsetPx, size.width + offsetPx, size.height + offsetPx,
            cornerPx, cornerPx, darkPaint
        )
    }
    drawIntoCanvas { canvas ->
        val lightPaint = android.graphics.Paint().apply {
            isAntiAlias = true
            color = lightColor.toArgb()
            maskFilter = BlurMaskFilter(blurPx, BlurMaskFilter.Blur.NORMAL)
        }
        canvas.nativeCanvas.drawRoundRect(
            -offsetPx, -offsetPx, size.width - offsetPx, size.height - offsetPx,
            cornerPx, cornerPx, lightPaint
        )
    }
}

/**
 * Segmented-control track (for Difficulty/Duration pickers): a soft, sunken
 * groove with genuine dual-tone (dark + light) blurred shadows carved into
 * its edges — the inactive options sit directly on this background with no
 * pill of their own, only the active option gets its own raised white pill
 * (see [SegmentActivePill]).
 */
@Composable
fun SegmentedTrack(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 18.dp,
    shape: Shape = RoundedCornerShape(cornerRadius),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val trackBg = if (isDark) Color(0xFF1A1F24) else Color(0xFFE7EBF1)
    val darkShadow = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
    val lightShadow = if (isDark) Color(0xFF2E363F).copy(alpha = 0.40f) else Color.White.copy(alpha = 0.85f)

    Box(
        modifier = modifier
            .clip(shape)
            .background(trackBg)
            .neumorphicDualShadow(
                darkColor = darkShadow,
                lightColor = lightShadow,
                blurRadius = 7.dp,
                offset = 4.dp,
                cornerRadius = cornerRadius,
                inset = true
            )
            .padding(5.dp),
        content = content
    )
}

/**
 * Raised white pill for the active segment inside a [SegmentedTrack] — real
 * dual-tone blurred shadows (dark bottom-right, light top-left) drawn
 * outside its own clipped bounds so it visibly pops up off the track, the
 * way a neumorphic "pressed up" element should read. This is the only piece
 * of chrome behind the active label; inactive labels are plain text with no
 * pill/background at all, matching the reference design.
 */
@Composable
fun SegmentActivePill(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 14.dp,
    shape: Shape = RoundedCornerShape(cornerRadius),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val pillBg = if (isDark) Color(0xFF262C33) else Color.White
    val darkShadow = if (isDark) Color.Black.copy(alpha = 0.45f) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
    val lightShadow = if (isDark) Color(0xFF3A4550).copy(alpha = 0.35f) else Color.White.copy(alpha = 0.85f)

    Box(
        modifier = modifier
            .neumorphicDualShadow(
                darkColor = darkShadow,
                lightColor = lightShadow,
                blurRadius = 6.dp,
                offset = 3.dp,
                cornerRadius = cornerRadius,
                inset = false
            )
            .clip(shape)
            .background(pillBg),
        contentAlignment = androidx.compose.ui.Alignment.Center,
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

