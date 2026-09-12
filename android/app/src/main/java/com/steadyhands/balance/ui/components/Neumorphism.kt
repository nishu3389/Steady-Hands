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
 * - Inset shaded background (#e9edf2)
 * - Top/Left darker inset shadow (creates carved look)
 * - Bottom/Right crisp highlight reflection
 */
@Composable
fun NeuInsetTrack(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(50.dp),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val trackBg = if (isDark) Color(0xFF162B3B) else Color(0xFFE9EDF2)
    val shadowColor = if (isDark) Color(0xFF0D1720).copy(alpha = 0.80f) else Color(0xFFA3B1C6).copy(alpha = 0.50f)
    val highlightColor = if (isDark) Color.White.copy(alpha = 0.05f) else Color.White.copy(alpha = 0.90f)

    Box(
        modifier = modifier
            .clip(shape)
            .background(trackBg)
            .drawBehind {
                // Top-left inset shadow gradient
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(shadowColor, Color.Transparent),
                        startY = 0f,
                        endY = 12.dp.toPx()
                    )
                )
                drawRect(
                    brush = Brush.horizontalGradient(
                        colors = listOf(shadowColor, Color.Transparent),
                        startX = 0f,
                        endX = 12.dp.toPx()
                    )
                )
                // Bottom-right inner highlight
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, highlightColor),
                        startY = size.height - 10.dp.toPx(),
                        endY = size.height
                    )
                )
            }
            .border(
                width = 1.dp,
                brush = Brush.linearGradient(
                    colors = listOf(
                        if (isDark) Color(0xFF0F1B25) else Color(0xFFD4DDE8),
                        if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.95f)
                    ),
                    start = Offset(0f, 0f),
                    end = Offset(300f, 300f)
                ),
                shape = shape
            )
            .padding(5.dp),
        content = content
    )
}

/**
 * Raised Neumorphic Pill (for Inactive Difficulty/Duration options like "Easy", "Hard", "45s", "90s")
 * Matches web: bg-white shadow-[0_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9)]
 */
@Composable
fun NeuRaisedPill(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(50.dp),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val pillBg = if (isDark) Color(0xFF191C1E) else Color.White
    val shadowColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.40f)

    Box(
        modifier = modifier
            .shadow(
                elevation = if (isDark) 2.dp else 4.dp,
                shape = shape,
                ambientColor = shadowColor,
                spotColor = shadowColor
            )
            .clip(shape)
            .background(pillBg)
            .border(
                width = 1.dp,
                color = if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.95f),
                shape = shape
            ),
        contentAlignment = androidx.compose.ui.Alignment.Center,
        content = content
    )
}

/**
 * Active Difficulty Inset Pill (Warm Amber: #ffdea8 with #5e4200 text)
 * Matches web: neumorphic-inset bg-[#ffdea8] dark:bg-[#5e4200] text-[#5e4200]
 */
@Composable
fun NeuActiveDifficultyPill(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(50.dp),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val activeBg = if (isDark) Color(0xFF5E4200) else Color(0xFFFFDEA8)
    val insetShadow = if (isDark) Color(0xFF281C00).copy(alpha = 0.6f) else Color(0xFF9E7100).copy(alpha = 0.25f)

    Box(
        modifier = modifier
            .clip(shape)
            .background(activeBg)
            .drawBehind {
                // Inset shadow top-left
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(insetShadow, Color.Transparent),
                        startY = 0f,
                        endY = 8.dp.toPx()
                    )
                )
                drawRect(
                    brush = Brush.horizontalGradient(
                        colors = listOf(insetShadow, Color.Transparent),
                        startX = 0f,
                        endX = 8.dp.toPx()
                    )
                )
            }
            .border(
                width = 1.dp,
                color = if (isDark) Color(0xFFFFDEA8).copy(alpha = 0.35f) else Color(0xFF5E4200).copy(alpha = 0.18f),
                shape = shape
            ),
        contentAlignment = androidx.compose.ui.Alignment.Center,
        content = content
    )
}

/**
 * Active Duration Inset Pill (Sky Blue: #d1e4ff with #004778 text and cyan/blue glow)
 * Matches web: neumorphic-inset bg-[#d1e4ff] shadow-[0_0_15px_rgba(0,95,158,0.35),inset_0_2px_4px_rgba(0,0,0,0.15)]
 */
@Composable
fun NeuActiveDurationPill(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(50.dp),
    isDark: Boolean = isSystemInDarkTheme(),
    content: @Composable BoxScope.() -> Unit
) {
    val activeBg = if (isDark) Color(0xFF004778) else Color(0xFFD1E4FF)
    val glowColor = if (isDark) Color(0xFF38BDF8).copy(alpha = 0.40f) else Color(0xFF005F9E).copy(alpha = 0.35f)
    val insetShadow = if (isDark) Color(0xFF00223D).copy(alpha = 0.60f) else Color(0xFF004778).copy(alpha = 0.22f)

    Box(
        modifier = modifier
            .shadow(
                elevation = 4.dp,
                shape = shape,
                ambientColor = glowColor,
                spotColor = glowColor
            )
            .clip(shape)
            .background(activeBg)
            .drawBehind {
                // Inset shadow top-left
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(insetShadow, Color.Transparent),
                        startY = 0f,
                        endY = 8.dp.toPx()
                    )
                )
            }
            .border(
                width = 1.2.dp,
                color = if (isDark) Color(0xFF38BDF8).copy(alpha = 0.50f) else Color(0xFF005F9E).copy(alpha = 0.35f),
                shape = shape
            ),
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

