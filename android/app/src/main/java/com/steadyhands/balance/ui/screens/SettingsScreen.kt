package com.steadyhands.balance.ui.screens

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cached
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Vibration
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.MainActivity
import com.steadyhands.balance.sensor.SensorFusionEngine
import com.steadyhands.balance.ui.components.NeuCard
import com.steadyhands.balance.ui.theme.*

@Composable
fun SettingsScreen(
    sensorEngine: SensorFusionEngine
) {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()

    var soundEnabled by remember { mutableStateOf(true) }
    var hapticEnabled by remember { mutableStateOf(true) }
    var sensitivityLevel by remember { mutableStateOf("Mindful (10°)") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Preferences",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
        )

        // Engine Switcher Card (Switch between Native Compose and Capacitor)
        NeuCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.SwapHoriz,
                        contentDescription = null,
                        tint = ZenTealPrimary
                    )
                    Text(
                        text = "App Engine Mode",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
                    )
                }

                Text(
                    text = "Current: Native Jetpack Compose (Kotlin). You can switch to the Capacitor WebView engine or back anytime.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary
                )

                Button(
                    onClick = {
                        val intent = Intent(context, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        }
                        context.startActivity(intent)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ZenTealPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Cached, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Switch to Capacitor WebView Engine", fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Feedback & Haptics
        NeuCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.VolumeUp, contentDescription = null, tint = ZenTealPrimary)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Audio Chimes", fontWeight = FontWeight.Medium)
                    }
                    Switch(
                        checked = soundEnabled,
                        onCheckedChange = { soundEnabled = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ZenTealPrimary)
                    )
                }

                Divider(color = if (isDark) ZenDarkBorder else ZenLightBorder)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Vibration, contentDescription = null, tint = ZenTealPrimary)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Spill Haptic Feedback", fontWeight = FontWeight.Medium)
                    }
                    Switch(
                        checked = hapticEnabled,
                        onCheckedChange = { hapticEnabled = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ZenTealPrimary)
                    )
                }
            }
        }

        // Sensitivity Level
        NeuCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Bowl Sensitivity: $sensitivityLevel",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    listOf("Beginner (14°)" to 14f, "Mindful (10°)" to 10f, "Master (6°)" to 6f).forEach { (label, angle) ->
                        val isSelected = sensitivityLevel == label
                        Surface(
                            onClick = {
                                sensitivityLevel = label
                                sensorEngine.safeAngleThreshold = angle
                            },
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) ZenTealPrimary else (if (isDark) ZenDarkCard else ZenLightCard),
                            border = if (!isSelected) BorderStroke(1.dp, if (isDark) ZenDarkBorder else ZenLightBorder) else null
                        ) {
                            Text(
                                text = label.split(" ")[0],
                                color = if (isSelected) Color.White else (if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
