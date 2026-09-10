package com.steadyhands.balance.ui

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.MainActivity
import com.steadyhands.balance.sensor.SensorFusionEngine
import com.steadyhands.balance.ui.screens.*
import com.steadyhands.balance.ui.theme.*
import com.steadyhands.balance.ui.tutorial.InteractiveTutorialDialog

enum class AppTab(val title: String, val icon: ImageVector) {
    PLAY("Play", Icons.Default.SelfImprovement),
    LEADERBOARD("Ranks", Icons.Default.EmojiEvents),
    GUIDE("Guide", Icons.Default.MenuBook),
    SETTINGS("Settings", Icons.Default.Settings)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SteadyHandsApp() {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()
    val sensorEngine = remember { SensorFusionEngine(context) }

    var currentTab by remember { mutableStateOf(AppTab.PLAY) }
    var showTutorial by remember { mutableStateOf(false) }

    // Check first launch tutorial preference
    LaunchedEffect(Unit) {
        val prefs = context.getSharedPreferences("steady_hands_prefs", Context.MODE_PRIVATE)
        val tutorialSeen = prefs.getBoolean("tutorial_seen", false)
        if (!tutorialSeen) {
            showTutorial = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Steady Hands",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = ZenTealPrimary
                        )
                        Surface(
                            color = ZenTealPrimary.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "COMPOSE",
                                color = ZenTealPrimary,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                actions = {
                    // Quick Switch to Web Button
                    TextButton(
                        onClick = {
                            val intent = Intent(context, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            }
                            context.startActivity(intent)
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.SwapHoriz,
                            contentDescription = "Switch to Web",
                            tint = ZenTealPrimary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Web Mode",
                            color = ZenTealPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = if (isDark) ZenDarkBg else ZenLightBg
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = if (isDark) ZenDarkCard else ZenLightSurface,
                tonalElevation = 6.dp
            ) {
                AppTab.values().forEach { tab ->
                    val isSelected = currentTab == tab
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentTab = tab },
                        icon = { Icon(tab.icon, contentDescription = tab.title) },
                        label = { Text(tab.title, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ZenTealPrimary,
                            selectedTextColor = ZenTealPrimary,
                            indicatorColor = ZenTealPrimary.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        },
        containerColor = if (isDark) ZenDarkBg else ZenLightBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentTab) {
                AppTab.PLAY -> PlayScreen(
                    sensorEngine = sensorEngine,
                    onOpenTutorial = { showTutorial = true }
                )
                AppTab.LEADERBOARD -> LeaderboardScreen()
                AppTab.GUIDE -> InstructionsScreen(
                    onReplayTutorial = { showTutorial = true }
                )
                AppTab.SETTINGS -> SettingsScreen(
                    sensorEngine = sensorEngine
                )
            }

            // Animated Interactive Tutorial Dialog
            if (showTutorial) {
                InteractiveTutorialDialog(
                    onDismiss = { showTutorial = false }
                )
            }
        }
    }
}
