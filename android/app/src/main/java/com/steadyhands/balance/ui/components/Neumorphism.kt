package com.steadyhands.balance.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.steadyhands.balance.ui.theme.*

@Composable
fun NeuCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(16.dp),
    elevation: Dp = 4.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val isDark = isSystemInDarkTheme()
    val bgColor = if (isDark) ZenDarkCard else ZenLightCard
    val borderColor = if (isDark) ZenDarkBorder.copy(alpha = 0.6f) else ZenLightBorder.copy(alpha = 0.8f)
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
