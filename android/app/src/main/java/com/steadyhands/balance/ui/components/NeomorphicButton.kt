package com.steadyhands.balance.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Design tokens from the original reference: a cool, very light gray-blue
// page, with the button fill a hair lighter still.
private val NeomorphicPageBg = Color(0xFFF2F6FA)
private val NeomorphicButtonFill = Color(0xFFF5F9FC)
private val NeomorphicAccentBlue = Color(0xFF287DB8)
private val NeomorphicDarkShadow = Color(0xFF9DAFC4).copy(alpha = 0.10f)
private val NeomorphicLightShadow = Color.White.copy(alpha = 0.80f)

/**
 * Reusable soft neumorphic button/tile: its only depth cue is a dark
 * cool-gray shadow and a near-white highlight (via [neumorphicDualShadow]),
 * with no border, no Material elevation, and no gradient fill. Works as
 * either a "raised" tile popping up off the page ([inset] = false, the
 * original standalone PLAY button look) or a "pressed-in" tile carved into
 * it ([inset] = true, used by the bottom nav's selected tab) — same visual
 * language, same shadow colors, just mirrored.
 *
 * Size, shape and content are all caller-controlled (size via [modifier],
 * corner radius via [cornerRadius], the icon/label/etc. via [content]) so
 * this one component covers both the big square PLAY button and the small
 * nav-bar tabs.
 */
@Composable
fun NeomorphicButton(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 30.dp,
    blurRadius: Dp = 17.dp,
    shadowOffset: Dp = 6.dp,
    fillColor: Color = NeomorphicButtonFill,
    darkShadowColor: Color = NeomorphicDarkShadow,
    lightShadowColor: Color = NeomorphicLightShadow,
    inset: Boolean = false,
    onClick: () -> Unit,
    content: @Composable BoxScope.() -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // depthScale drives both shadows' opacity/offset/blur together so
    // pressing genuinely flattens the effect rather than just moving the
    // content — 0.45 rather than 0 so it softens without vanishing.
    val depthScale by animateFloatAsState(
        targetValue = if (isPressed) 0.45f else 1f,
        animationSpec = tween(120),
        label = "neuDepthScale"
    )
    val contentOffset by animateDpAsState(
        targetValue = if (isPressed) 1.5.dp else 0.dp,
        animationSpec = tween(120),
        label = "neuContentOffset"
    )

    val shape = RoundedCornerShape(cornerRadius)
    val shadowedModifier = Modifier.neumorphicDualShadow(
        darkColor = darkShadowColor.copy(alpha = darkShadowColor.alpha * depthScale),
        lightColor = lightShadowColor.copy(alpha = lightShadowColor.alpha * depthScale),
        blurRadius = blurRadius * depthScale.coerceAtLeast(0.05f),
        offset = shadowOffset * depthScale.coerceAtLeast(0.05f),
        cornerRadius = cornerRadius,
        inset = inset
    )

    // Raised: shadow drawn UNCLIPPED first so it bleeds past the shape's own
    // bounds, then clip+background on top for the flat fill.
    // Inset: clip+background first so the shadow that follows gets carved
    // into the already-bounded shape instead of spilling outward.
    val depthModifier = if (inset) {
        Modifier.clip(shape).background(fillColor).then(shadowedModifier)
    } else {
        shadowedModifier.clip(shape).background(fillColor)
    }

    Box(
        modifier = modifier
            .then(depthModifier)
            .clickable(
                interactionSource = interactionSource,
                // A default ripple would read as a hard Material effect and
                // fight the soft neumorphic look, so it's suppressed — the
                // depth animation above is the only press feedback.
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Box(modifier = Modifier.offset(y = contentOffset)) {
            content()
        }
    }
}

@Preview(showBackground = true, widthDp = 300, heightDp = 300)
@Composable
private fun NeomorphicButtonPreview() {
    Surface(color = NeomorphicPageBg) {
        Box(modifier = Modifier.size(300.dp), contentAlignment = Alignment.Center) {
            NeomorphicButton(
                modifier = Modifier.size(140.dp),
                onClick = {}
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Outlined.SportsEsports,
                        contentDescription = "Play",
                        tint = NeomorphicAccentBlue,
                        modifier = Modifier.size(40.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "PLAY",
                        color = NeomorphicAccentBlue,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 2.sp
                    )
                }
            }
        }
    }
}
