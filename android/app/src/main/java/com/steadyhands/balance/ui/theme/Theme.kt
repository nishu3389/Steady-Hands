package com.steadyhands.balance.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = ZenTealLight,
    onPrimary = ZenDarkBg,
    secondary = ZenCyanRipple,
    onSecondary = ZenDarkBg,
    background = ZenDarkBg,
    onBackground = ZenDarkTextPrimary,
    surface = ZenDarkSurface,
    onSurface = ZenDarkTextPrimary,
    surfaceVariant = ZenDarkCard,
    onSurfaceVariant = ZenDarkTextSecondary,
    outline = ZenDarkBorder,
    error = ZenSpillCrimson
)

private val LightColorScheme = lightColorScheme(
    primary = ZenTealPrimary,
    onPrimary = ZenLightSurface,
    secondary = ZenOceanBlue,
    onSecondary = ZenLightSurface,
    background = ZenLightBg,
    onBackground = ZenLightTextPrimary,
    surface = ZenLightSurface,
    onSurface = ZenLightTextPrimary,
    surfaceVariant = ZenLightCard,
    onSurfaceVariant = ZenLightTextSecondary,
    outline = ZenLightBorder,
    error = ZenSpillCrimson
)

@Composable
fun SteadyHandsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
