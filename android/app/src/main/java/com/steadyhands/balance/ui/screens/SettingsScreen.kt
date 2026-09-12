package com.steadyhands.balance.ui.screens

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.MainActivity
import com.steadyhands.balance.R
import com.steadyhands.balance.sensor.SensorFusionEngine
import com.steadyhands.balance.ui.components.AdMobBannerAd
import com.steadyhands.balance.ui.components.SegmentActivePill
import com.steadyhands.balance.ui.components.SegmentedTrack
import com.steadyhands.balance.ui.components.neumorphicDualShadow
import com.steadyhands.balance.ui.theme.*

private enum class ThemeMode { DAY, NIGHT, AUTO }
private enum class TiltSensitivity(val label: String, val display: String, val multiplier: Float) {
    GENTLE("Gentle", "Gentle (0.75x)", 0.75f),
    NORMAL("Normal", "Standard (1.0x)", 1.0f),
    HIGH("High", "High (1.5x)", 1.5f)
}

@Composable
fun SettingsScreen(
    sensorEngine: SensorFusionEngine,
    onOpenTutorial: () -> Unit = {}
) {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()

    var themeMode by remember { mutableStateOf(ThemeMode.AUTO) }
    var soundEnabled by remember { mutableStateOf(true) }
    var tiltSensitivity by remember { mutableStateOf(TiltSensitivity.NORMAL) }
    var isSignedIn by remember { mutableStateOf(true) }
    var playerName by remember { mutableStateOf("Player") }

    val cardShadowDark = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.40f)
    val cardShadowLight = if (isDark) Color(0xFF3A4550).copy(alpha = 0.30f) else Color.White.copy(alpha = 0.85f)
    val cardBg = if (isDark) Color(0xFF191C1E) else Color.White

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp)
            .widthIn(max = 420.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {
        // ---- How to Play ----
        SettingsSection(title = "How to Play") {
            SettingsCard(cardBg, cardShadowDark, cardShadowLight) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isDark) MindfulCardBgDark else MindfulCardBgLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_lucide_sparkles),
                            contentDescription = null,
                            tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Animated Tutorial",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) TextPrimaryDark else TextPrimaryLight
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "4-step animated walkthrough teaching level calibration, walking rhythm, spill prevention, and steadiness scores.",
                            fontSize = 12.sp,
                            lineHeight = 17.sp,
                            color = if (isDark) TextMutedDark else Color(0xFF5A626F)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                SettingsPrimaryButton(
                    label = "Launch Animated Tutorial",
                    iconRes = R.drawable.ic_lucide_play,
                    isDark = isDark,
                    onClick = onOpenTutorial
                )
            }
        }

        // ---- Appearance ----
        SettingsSection(title = "Appearance") {
            SettingsCard(cardBg, cardShadowDark, cardShadowLight) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(
                        painter = painterResource(
                            id = when (themeMode) {
                                ThemeMode.DAY -> R.drawable.ic_lucide_sun
                                ThemeMode.NIGHT -> R.drawable.ic_lucide_moon
                                ThemeMode.AUTO -> R.drawable.ic_lucide_laptop
                            }
                        ),
                        contentDescription = null,
                        tint = when (themeMode) {
                            ThemeMode.DAY -> Color(0xFFF59E0B)
                            ThemeMode.NIGHT -> Color(0xFF818CF8)
                            ThemeMode.AUTO -> if (isDark) BrandBlueDark else BrandBluePrimary
                        },
                        modifier = Modifier.size(20.dp)
                    )
                    Column {
                        Text(
                            text = "Theme Mode",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isDark) TextPrimaryDark else TextPrimaryLight
                        )
                        Text(
                            text = when (themeMode) {
                                ThemeMode.DAY -> "Day Mode (Light)"
                                ThemeMode.NIGHT -> "Night Mode (Dark)"
                                ThemeMode.AUTO -> "System Default"
                            },
                            fontSize = 11.sp,
                            color = if (isDark) TextMutedDark else TextSecondaryLight
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                SegmentedTrack(modifier = Modifier.fillMaxWidth(), cornerRadius = 14.dp, isDark = isDark) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        ThreeWayOption(
                            modifier = Modifier.weight(1f),
                            iconRes = R.drawable.ic_lucide_sun,
                            iconTint = Color(0xFFF59E0B),
                            label = "Day",
                            isActive = themeMode == ThemeMode.DAY,
                            isDark = isDark
                        ) { themeMode = ThemeMode.DAY }
                        ThreeWayOption(
                            modifier = Modifier.weight(1f),
                            iconRes = R.drawable.ic_lucide_moon,
                            iconTint = Color(0xFF818CF8),
                            label = "Night",
                            isActive = themeMode == ThemeMode.NIGHT,
                            isDark = isDark
                        ) { themeMode = ThemeMode.NIGHT }
                        ThreeWayOption(
                            modifier = Modifier.weight(1f),
                            iconRes = R.drawable.ic_lucide_laptop,
                            iconTint = if (isDark) BrandBlueDark else BrandBluePrimary,
                            label = "Auto",
                            isActive = themeMode == ThemeMode.AUTO,
                            isDark = isDark
                        ) { themeMode = ThemeMode.AUTO }
                    }
                }
            }
        }

        // ---- Audio ---- (Haptic Vibration row intentionally omitted)
        SettingsSection(title = "Audio") {
            SettingsCard(cardBg, cardShadowDark, cardShadowLight) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(
                            painter = painterResource(
                                id = if (soundEnabled) R.drawable.ic_lucide_volume_2 else R.drawable.ic_lucide_volume_x
                            ),
                            contentDescription = null,
                            tint = if (soundEnabled) (if (isDark) BrandBlueDark else BrandBluePrimary) else TextSecondaryLight,
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = "Sound Effects",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isDark) TextPrimaryDark else TextPrimaryLight
                        )
                    }
                    Switch(
                        checked = soundEnabled,
                        onCheckedChange = { soundEnabled = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = if (isDark) Color(0xFF0078C6) else BrandBluePrimary,
                            checkedTrackColor = (if (isDark) Color(0xFF0078C6) else BrandBluePrimary).copy(alpha = 0.35f)
                        )
                    )
                }
            }
        }

        // ---- Controls ----
        SettingsSection(title = "Controls") {
            SettingsCard(cardBg, cardShadowDark, cardShadowLight) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        text = "Tilt Sensitivity",
                        fontSize = 14.sp,
                        color = if (isDark) TextSecondaryDark else TextSecondaryLight
                    )
                    Text(
                        text = tiltSensitivity.display,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) BrandBlueDark else BrandBluePrimary
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                SegmentedTrack(modifier = Modifier.fillMaxWidth(), cornerRadius = 14.dp, isDark = isDark) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        TiltSensitivity.values().forEach { option ->
                            val isActive = tiltSensitivity == option
                            val content = @Composable {
                                Text(
                                    text = option.label,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isActive) {
                                        if (isDark) BrandBlueDark else BrandBluePrimary
                                    } else {
                                        if (isDark) TextSecondaryDark else TextPrimaryLight
                                    },
                                    modifier = Modifier.padding(vertical = 9.dp)
                                )
                            }
                            if (isActive) {
                                SegmentActivePill(modifier = Modifier.weight(1f), cornerRadius = 10.dp, isDark = isDark) {
                                    Box(contentAlignment = Alignment.Center) { content() }
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { tiltSensitivity = option },
                                    contentAlignment = Alignment.Center
                                ) { content() }
                            }
                        }
                    }
                }
            }
        }

        // ---- App Engine (temporary — just a mode-switch button, not
        // styled to match the reference since this section is a stopgap) ----
        SettingsSection(title = "App Engine") {
            SettingsCard(cardBg, cardShadowDark, cardShadowLight) {
                SettingsPrimaryButton(
                    label = "Switch to Capacitor WebView Engine",
                    iconRes = R.drawable.ic_lucide_cpu,
                    isDark = isDark,
                    onClick = {
                        val intent = Intent(context, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        }
                        context.startActivity(intent)
                    }
                )
            }
        }

        // ---- Account ----
        SettingsSection(title = "Account") {
            SettingsCard(cardBg, cardShadowDark, cardShadowLight) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(if (isDark) Color(0xFF2D3133) else Color(0xFFE0E3E6)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_lucide_user),
                            contentDescription = null,
                            tint = TextSecondaryLight,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (isSignedIn) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = playerName,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDark) TextPrimaryDark else TextPrimaryLight
                            )
                            Text(
                                text = "edit",
                                fontSize = 12.sp,
                                color = if (isDark) BrandBlueDark else BrandBluePrimary,
                                textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline,
                                modifier = Modifier.clickable { /* rename flow not wired yet */ }
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_lucide_shield_check),
                                contentDescription = null,
                                tint = Color(0xFF34A853),
                                modifier = Modifier.size(13.dp)
                            )
                            Text(text = "Google Connected", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF34A853))
                        }
                    } else {
                        Text(
                            text = "Sign in to save your scores and compete on the global leaderboard.",
                            fontSize = 13.sp,
                            color = if (isDark) TextSecondaryDark else TextSecondaryLight,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .neumorphicDualShadow(
                                darkColor = cardShadowDark,
                                lightColor = cardShadowLight,
                                blurRadius = 6.dp,
                                offset = 3.dp,
                                cornerRadius = 28.dp,
                                inset = false
                            )
                            .clip(RoundedCornerShape(28.dp))
                            .background(cardBg)
                            .clickable {
                                isSignedIn = !isSignedIn
                                if (!isSignedIn) playerName = "Guest Player"
                            }
                            .padding(vertical = 13.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_google_logo),
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = if (isSignedIn) "Sign out of Google" else "Sign in with Google",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isDark) TextPrimaryDark else TextPrimaryLight
                        )
                    }
                }
            }
        }

        // ---- Real Google AdMob Banner (settings placement) ----
        AdMobBannerAd(modifier = Modifier.fillMaxWidth())

        Spacer(modifier = Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            Text(
                text = "VERSION 1.0.2",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                color = TextSecondaryLight.copy(alpha = 0.7f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun SettingsSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title,
            fontSize = 19.sp,
            fontWeight = FontWeight.Bold,
            color = if (isSystemInDarkTheme()) TextPrimaryDark else TextPrimaryLight
        )
        content()
    }
}

@Composable
private fun SettingsCard(
    cardBg: Color,
    shadowDark: Color,
    shadowLight: Color,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .neumorphicDualShadow(
                darkColor = shadowDark,
                lightColor = shadowLight,
                blurRadius = 6.dp,
                offset = 3.dp,
                cornerRadius = 18.dp,
                inset = false
            )
            .clip(RoundedCornerShape(18.dp))
            .background(cardBg)
            .padding(16.dp)
    ) {
        content()
    }
}

@Composable
private fun SettingsPrimaryButton(label: String, iconRes: Int, isDark: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (isDark) BrandBlueDark else BrandBluePrimary)
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            painter = painterResource(id = iconRes),
            contentDescription = null,
            tint = if (isDark) Color(0xFF003258) else Color.White,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.3.sp,
            color = if (isDark) Color(0xFF003258) else Color.White
        )
    }
}

@Composable
private fun ThreeWayOption(
    modifier: Modifier,
    iconRes: Int,
    iconTint: Color,
    label: String,
    isActive: Boolean,
    isDark: Boolean,
    onClick: () -> Unit
) {
    val content = @Composable {
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(vertical = 9.dp)
        ) {
            Icon(painter = painterResource(id = iconRes), contentDescription = null, tint = iconTint, modifier = Modifier.size(14.dp))
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = if (isActive) {
                    if (isDark) BrandBlueDark else BrandBluePrimary
                } else {
                    if (isDark) TextSecondaryDark else TextPrimaryLight
                }
            )
        }
    }
    if (isActive) {
        SegmentActivePill(modifier = modifier, cornerRadius = 10.dp, isDark = isDark) {
            Box(contentAlignment = Alignment.Center) { content() }
        }
    } else {
        Box(modifier = modifier.clickable(onClick = onClick), contentAlignment = Alignment.Center) { content() }
    }
}
