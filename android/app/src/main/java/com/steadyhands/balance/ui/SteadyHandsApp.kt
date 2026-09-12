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
                // Pixel-Perfect Bottom Nav Bar (Height ~72dp, 4 tabs: PLAY, INFO, RANK, SET)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(
                            elevation = 16.dp,
                            ambientColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.40f),
                            spotColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.40f)
                        )
                        .background(if (isDark) Color(0xFF191C1E).copy(alpha = 0.98f) else Color.White.copy(alpha = 0.98f))
                        .border(
                            width = 1.dp,
                            color = if (isDark) Color.White.copy(alpha = 0.05f) else Color(0xFF005F9E).copy(alpha = 0.08f)
                        )
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(60.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AppTab.values().forEach { tab ->
                            val isSelected = currentTab == tab

                            if (isSelected) {
                                val activeBg = if (isDark) Color(0xFF152331) else Color(0xFFE8F0F8)
                                val insetShadow = if (isDark) Color(0xFF081018).copy(alpha = 0.70f) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
                                val insetHighlight = if (isDark) Color.White.copy(alpha = 0.05f) else Color.White.copy(alpha = 0.95f)

                                Box(
                                    modifier = Modifier
                                        .size(width = 68.dp, height = 54.dp)
                                        .shadow(
                                            elevation = 2.dp,
                                            shape = RoundedCornerShape(18.dp),
                                            ambientColor = BrandBluePrimary.copy(alpha = 0.15f),
                                            spotColor = BrandBluePrimary.copy(alpha = 0.15f)
                                        )
                                        .clip(RoundedCornerShape(18.dp))
                                        .background(activeBg)
                                        .drawBehind {
                                            // Top-left inset shadow
                                            drawRect(
                                                brush = Brush.verticalGradient(
                                                    colors = listOf(insetShadow, Color.Transparent),
                                                    startY = 0f,
                                                    endY = 6.dp.toPx()
                                                )
                                            )
                                            drawRect(
                                                brush = Brush.horizontalGradient(
                                                    colors = listOf(insetShadow, Color.Transparent),
                                                    startX = 0f,
                                                    endX = 6.dp.toPx()
                                                )
                                            )
                                            // Bottom-right inner highlight
                                            drawRect(
                                                brush = Brush.verticalGradient(
                                                    colors = listOf(Color.Transparent, insetHighlight),
                                                    startY = size.height - 6.dp.toPx(),
                                                    endY = size.height
                                                )
                                            )
                                        }
                                        .border(
                                            width = 1.dp,
                                            color = if (isDark) BrandBlueDark.copy(alpha = 0.30f) else BrandBluePrimary.copy(alpha = 0.20f),
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
                                            tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = tab.label,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            letterSpacing = 1.sp,
                                            color = if (isDark) BrandBlueDark else BrandBluePrimary
                                        )
                                    }
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(width = 68.dp, height = 54.dp)
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
                                            tint = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = tab.label,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            letterSpacing = 1.sp,
                                            color = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
                                        )
                                    }
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
