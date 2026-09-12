package com.steadyhands.balance.ui.theme

import android.content.Context
import android.content.res.Configuration
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.steadyhands.balance.SteadyHandsApplication

enum class ThemeMode { DAY, NIGHT, AUTO }

private const val PREFS_NAME = "steady_hands_prefs"
private const val KEY_THEME_MODE = "theme_mode"

/** App-wide theme selection, persisted across process restarts. */
object ThemeState {
    var mode by mutableStateOf(ThemeMode.AUTO)
        private set

    private var initialized = false

    fun init(context: Context) {
        if (initialized) return
        initialized = true
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val saved = prefs.getString(KEY_THEME_MODE, null)
        mode = saved?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() } ?: ThemeMode.AUTO
    }

    fun setMode(context: Context, newMode: ThemeMode) {
        mode = newMode
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_THEME_MODE, newMode.name)
            .apply()
        SteadyHandsApplication.refreshDarkMode(context)
    }

    /** Non-Composable equivalent of [resolveIsDarkTheme], for use outside Compose (e.g. SteadyHandsApplication). */
    fun resolveIsDarkMode(context: Context): Boolean = when (mode) {
        ThemeMode.DAY -> false
        ThemeMode.NIGHT -> true
        ThemeMode.AUTO -> {
            val uiMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
            uiMode == Configuration.UI_MODE_NIGHT_YES
        }
    }
}

/** Resolves the effective dark/light state from the user's theme selection. */
@Composable
fun resolveIsDarkTheme(): Boolean = when (ThemeState.mode) {
    ThemeMode.DAY -> false
    ThemeMode.NIGHT -> true
    ThemeMode.AUTO -> isSystemInDarkTheme()
}
