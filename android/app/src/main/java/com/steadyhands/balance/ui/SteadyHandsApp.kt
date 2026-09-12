package com.steadyhands.balance.ui

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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

enum class AppTab(val label: String, val screenTitle: String, val icon: ImageVector) {
    PLAY("PLAY", "Play", Icons.Default.SportsEsports),
    INFO("INFO", "Instructions", Icons.Default.MenuBook),
    RANK("RANK", "Leaderboard", Icons.Default.EmojiEvents),
    SET("SET", "Settings", Icons.Default.Settings)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SteadyHandsApp() {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()
    val sensorEngine = remember { SensorFusionEngine(context) }

    var currentTab by remember { mutableStateOf(AppTab.PLAY) }
    var showTutorial by remember { mutableStateOf(false) }
    var isGameActive by remember { mutableStateOf(false) }

    // Check first launch tutorial preference
    LaunchedEffect(Unit) {
        val prefs = context.getSharedPreferences("steady_hands_prefs", Context.MODE_PRIVATE)
        val tutorialSeen = prefs.getBoolean("tutorial_seen", false)
        if (!tutorialSeen) {
            showTutorial = true
        }
    }

    Scaffold(
        bottomBar = {
            if (!isGameActive) {
                // Pixel-Perfect Bottom Nav Bar (Height 76dp, 4 tabs: PLAY, INFO, RANK, SET)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(
                            elevation = 12.dp,
                            ambientColor = if (isDark) NeuDarkShadowInDark else NeuDarkShadow,
                            spotColor = if (isDark) NeuDarkShadowInDark else NeuDarkShadow
                        )
                        .background(if (isDark) BottomNavBgDark else BottomNavBgLight)
                        .border(
                            width = 1.dp,
                            color = if (isDark) Color.White.copy(alpha = 0.05f) else Color.Black.copy(alpha = 0.06f)
                        )
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AppTab.values().forEach { tab ->
                            val isSelected = currentTab == tab

                            val selectedTabBg = if (isSelected) {
                                if (isDark) {
                                    Brush.linearGradient(
                                        colors = listOf(Color(0xFF1B2836), Color(0xFF131D28))
                                    )
                                } else {
                                    Brush.linearGradient(
                                        colors = listOf(Color(0xFFE2ECF7), Color(0xFFEDF4FB))
                                    )
                                }
                            } else {
                                Brush.linearGradient(
                                    colors = listOf(Color.Transparent, Color.Transparent)
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .size(width = 68.dp, height = 58.dp)
                                    .shadow(
                                        elevation = if (isSelected) (if (isDark) 2.dp else 2.dp) else 0.dp,
                                        shape = RoundedCornerShape(18.dp),
                                        ambientColor = if (isSelected) BrandBluePrimary.copy(alpha = 0.25f) else Color.Transparent,
                                        spotColor = if (isSelected) BrandBluePrimary.copy(alpha = 0.25f) else Color.Transparent
                                    )
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(selectedTabBg)
                                    .border(
                                        width = if (isSelected) 1.dp else 0.dp,
                                        color = if (isSelected) {
                                            if (isDark) BrandBlueDark.copy(alpha = 0.35f) else BrandBluePrimary.copy(alpha = 0.30f)
                                        } else Color.Transparent,
                                        shape = RoundedCornerShape(18.dp)
                                    )
                                    .clickable { currentTab = tab },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                    modifier = Modifier.padding(2.dp)
                                ) {
                                    Icon(
                                        imageVector = tab.icon,
                                        contentDescription = tab.label,
                                        tint = if (isSelected) {
                                            if (isDark) BrandBlueDark else BrandBluePrimary
                                        } else {
                                            if (isDark) TextSecondaryDark else TextMutedLight
                                        },
                                        modifier = Modifier.size(24.dp)
                                    )

                                    Spacer(modifier = Modifier.height(2.dp))

                                    Text(
                                        text = tab.label,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Bold,
                                        letterSpacing = 1.sp,
                                        color = if (isSelected) {
                                            if (isDark) BrandBlueDark else BrandBluePrimary
                                        } else {
                                            if (isDark) TextSecondaryDark else TextMutedLight
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        containerColor = if (isDark) CanvasBgDark else CanvasBgLight
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentTab) {
                AppTab.PLAY -> PlayScreen(
                    sensorEngine = sensorEngine,
                    onOpenTutorial = { showTutorial = true },
                    onGameActiveChanged = { active -> isGameActive = active }
                )
                AppTab.INFO -> InstructionsScreen(
                    onReplayTutorial = { showTutorial = true }
                )
                AppTab.RANK -> LeaderboardScreen()
                AppTab.SET -> SettingsScreen(
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
