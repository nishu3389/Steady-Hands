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
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
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
import com.steadyhands.balance.ui.components.*
import com.steadyhands.balance.ui.screens.*
import com.steadyhands.balance.ui.theme.*
import com.steadyhands.balance.ui.tutorial.InteractiveTutorialDialog

// Matches the web's bottom nav, which renders every tab icon with
// `material-symbols-outlined` (thin outline style, never filled) regardless
// of selected state — so these use Material's Outlined icon set, not Filled.
enum class AppTab(val label: String, val screenTitle: String, val icon: ImageVector) {
    PLAY("PLAY", "Play", Icons.Outlined.SportsEsports),
    INFO("INFO", "Instructions", Icons.Outlined.MenuBook),
    RANK("RANK", "Leaderboard", Icons.Outlined.EmojiEvents),
    SET("SET", "Settings", Icons.Outlined.Settings)
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
                // Bottom Nav Bar: a plain, mostly-flat bar (matching the
                // reference — no carved-in groove across the whole bar), with
                // the selected tab popping up as the same [SegmentActivePill]
                // raised chip used by the Difficulty/Duration selectors, so
                // the "selected" language is shared while the bar itself
                // stays light.
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(
                            elevation = 8.dp,
                            ambientColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.25f),
                            spotColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.25f)
                        )
                        .background(if (isDark) Color(0xFF191C1E).copy(alpha = 0.98f) else Color.White.copy(alpha = 0.98f))
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
                                // Pressed-in squircle: near-white bg, very
                                // rounded corners, but the shadow is carved
                                // INTO the shape (dark near the top-left
                                // edge, light near the bottom-right edge) —
                                // real depth, not a bump sitting on top. Same
                                // shared NeomorphicButton used for the main
                                // PLAY dial trigger, just smaller and
                                // inverted (inset = true).
                                val activeBg = if (isDark) Color(0xFF1E2328) else Color(0xFFF8FAFC)
                                val activeTint = if (isDark) Color(0xFF60A5FA) else Color(0xFF2F8FE0)
                                val darkShadow = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA9B6C8).copy(alpha = 0.55f)
                                val lightShadow = if (isDark) Color(0xFF34404A).copy(alpha = 0.40f) else Color.White.copy(alpha = 1f)

                                NeomorphicButton(
                                    modifier = Modifier.size(width = 68.dp, height = 54.dp),
                                    cornerRadius = 22.dp,
                                    blurRadius = 8.dp,
                                    shadowOffset = 3.dp,
                                    fillColor = activeBg,
                                    darkShadowColor = darkShadow,
                                    lightShadowColor = lightShadow,
                                    inset = true,
                                    onClick = { currentTab = tab }
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center,
                                        modifier = Modifier.padding(2.dp)
                                    ) {
                                        Icon(
                                            imageVector = tab.icon,
                                            contentDescription = tab.label,
                                            tint = activeTint,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = tab.label,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            letterSpacing = 1.sp,
                                            color = activeTint
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
                AppTab.RANK -> LeaderboardScreen(onPlayNow = { currentTab = AppTab.PLAY })
                AppTab.SET -> SettingsScreen(
                    sensorEngine = sensorEngine,
                    onOpenTutorial = { showTutorial = true }
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
