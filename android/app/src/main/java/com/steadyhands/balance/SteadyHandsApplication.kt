package com.steadyhands.balance

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import com.steadyhands.balance.ui.theme.ThemeState

/**
 * Keeps the app's resolved Day/Night state available instantly, app-wide --
 * refreshed on app launch and whenever the user switches the mode
 * (ThemeState.setMode). EngineSwitchPlugin reads it directly so a web
 * screen launched from Compose (tutorial/game) already knows the right
 * theme before it draws its first frame, instead of discovering it only
 * after an async round trip (which is what caused the light/dark blink).
 */
class SteadyHandsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ThemeState.init(this)
        refreshDarkMode(this)
    }

    // AUTO mode tracks the system setting, which can change while the app
    // is already running (without the user touching our own Settings
    // screen) -- keep the cache current for that case too.
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        refreshDarkMode(this)
    }

    companion object {
        @Volatile
        private var isDarkModeValue: Boolean = false

        @JvmStatic
        fun isDarkMode(): Boolean = isDarkModeValue

        @JvmStatic
        fun refreshDarkMode(context: Context) {
            isDarkModeValue = ThemeState.resolveIsDarkMode(context)
        }
    }
}
