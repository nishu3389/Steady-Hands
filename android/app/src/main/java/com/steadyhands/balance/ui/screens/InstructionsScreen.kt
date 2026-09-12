package com.steadyhands.balance.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.R
import com.steadyhands.balance.data.MINDFUL_BENEFITS
import com.steadyhands.balance.ui.components.AdMobBannerAd
import com.steadyhands.balance.ui.components.SegmentActivePill
import com.steadyhands.balance.ui.components.SegmentedTrack
import com.steadyhands.balance.ui.components.neumorphicDualShadow
import com.steadyhands.balance.ui.theme.*

private enum class InfoTab { HOW_TO_PLAY, MIND_BODY }

private data class HowToPlayStep(
    val number: Int,
    val iconRes: Int,
    val iconTintLight: Color,
    val iconTintDark: Color,
    val text: String,
    val rotateIconDeg: Float = 0f
)

private val HOW_TO_PLAY_STEPS = listOf(
    HowToPlayStep(1, R.drawable.ic_lucide_smartphone, Color(0xFF7C5800), Color(0xFFF4BE57), "Hold your phone flat and steady"),
    HowToPlayStep(2, R.drawable.ic_lucide_droplets, Color(0xFFA9301B), Color(0xFFFFB4A5), "Don't tilt — water spills fast", rotateIconDeg = 12f),
    HowToPlayStep(3, R.drawable.ic_lucide_footprints, Color(0xFF7C5800), Color(0xFFF4BE57), "Walk steadily: Timer pauses if you stop"),
    HowToPlayStep(4, R.drawable.ic_lucide_timer, Color(0xFF7C5800), Color(0xFFF4BE57), "Keep 50%+ water when time runs out to win")
)

@Composable
fun InstructionsScreen(
    onReplayTutorial: () -> Unit
) {
    val isDark = isSystemInDarkTheme()
    var activeTab by remember { mutableStateOf(InfoTab.HOW_TO_PLAY) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .widthIn(max = 420.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Segmented Tab Switcher — same shared component as the
        // Difficulty/Duration selectors and bottom nav.
        SegmentedTrack(modifier = Modifier.fillMaxWidth(), isDark = isDark) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                InfoTabOption(
                    modifier = Modifier.weight(1f),
                    iconRes = R.drawable.ic_lucide_book_open,
                    label = "How to Play",
                    isActive = activeTab == InfoTab.HOW_TO_PLAY,
                    isDark = isDark,
                    onClick = { activeTab = InfoTab.HOW_TO_PLAY }
                )
                InfoTabOption(
                    modifier = Modifier.weight(1f),
                    iconRes = R.drawable.ic_lucide_sparkles,
                    label = "Mind & Body",
                    isActive = activeTab == InfoTab.MIND_BODY,
                    isDark = isDark,
                    onClick = { activeTab = InfoTab.MIND_BODY }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Title & Subtitle Header
        Text(
            text = if (activeTab == InfoTab.HOW_TO_PLAY) "Steady Hands Guide" else "Mind & Body Benefits",
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = (-0.4).sp,
            color = if (isDark) BrandBlueDark else BrandBluePrimary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = if (activeTab == InfoTab.HOW_TO_PLAY)
                "Keep a steady hand and don't spill the water!"
            else
                "A physical mindfulness exercise in somatic awareness.",
            fontSize = 12.sp,
            color = if (isDark) TextMutedDark else TextSecondaryLight,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Real Google AdMob Banner (instructions placement)
        AdMobBannerAd(modifier = Modifier.fillMaxWidth())

        Spacer(modifier = Modifier.height(20.dp))

        if (activeTab == InfoTab.HOW_TO_PLAY) {
            HowToPlayContent(isDark = isDark, onReplayTutorial = onReplayTutorial)
        } else {
            MindBodyContent(isDark = isDark)
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun InfoTabOption(
    modifier: Modifier = Modifier,
    iconRes: Int,
    label: String,
    isActive: Boolean,
    isDark: Boolean,
    onClick: () -> Unit
) {
    val tint = if (isActive) {
        if (isDark) BrandBlueDark else BrandBluePrimary
    } else {
        if (isDark) TextSecondaryDark else TextSecondaryLight
    }

    val row = @Composable {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(16.dp)
            )
            Text(text = label, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = tint)
        }
    }

    if (isActive) {
        SegmentActivePill(modifier = modifier, isDark = isDark) { row() }
    } else {
        Box(
            modifier = modifier.clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) { row() }
    }
}

@Composable
private fun HowToPlayContent(isDark: Boolean, onReplayTutorial: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth()) {
        // Visual Guide / Watch Animated Tutorial quick-launch banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(BrandBluePrimary, Color(0xFF0078C6))
                    )
                )
                .clickable(onClick = onReplayTutorial)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.20f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_lucide_sparkles),
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "VISUAL GUIDE",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp,
                            color = Color(0xFFBAE6FD)
                        )
                        Text(
                            text = "Watch Animated Tutorial",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.20f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_lucide_play),
                        contentDescription = "Play tutorial",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Numbered steps with a connecting timeline line
        Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            HOW_TO_PLAY_STEPS.forEachIndexed { index, step ->
                Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    // Number badge + connecting line down to the next badge
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxHeight()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .neumorphicDualShadow(
                                    darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.40f),
                                    lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.30f) else Color.White.copy(alpha = 0.85f),
                                    blurRadius = 5.dp,
                                    offset = 2.dp,
                                    cornerRadius = 28.dp,
                                    inset = false
                                )
                                .clip(CircleShape)
                                .background(if (isDark) Color(0xFF191C1E) else Color.White),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${step.number}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isDark) BrandBlueDark else BrandBluePrimary
                            )
                        }

                        if (index != HOW_TO_PLAY_STEPS.lastIndex) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .width(3.dp)
                                    .background(
                                        if (isDark) Color(0xFF2D3133) else Color(0xFFE0E3E6),
                                        RoundedCornerShape(2.dp)
                                    )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    // Content card
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .padding(bottom = if (index != HOW_TO_PLAY_STEPS.lastIndex) 18.dp else 0.dp)
                            .neumorphicDualShadow(
                                darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.40f),
                                lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.30f) else Color.White.copy(alpha = 0.85f),
                                blurRadius = 6.dp,
                                offset = 3.dp,
                                cornerRadius = 18.dp,
                                inset = false
                            )
                            .clip(RoundedCornerShape(18.dp))
                            .background(if (isDark) Color(0xFF191C1E) else Color.White)
                            .padding(16.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            Icon(
                                painter = painterResource(id = step.iconRes),
                                contentDescription = null,
                                tint = if (isDark) step.iconTintDark else step.iconTintLight,
                                modifier = Modifier
                                    .size(30.dp)
                                    .rotate(step.rotateIconDeg)
                            )
                            Text(
                                text = step.text,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isDark) TextPrimaryDark else TextPrimaryLight
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        GotItButton(isDark = isDark, label = "Got it", onClick = {})
    }
}

@Composable
private fun MindBodyContent(isDark: Boolean) {
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        MINDFUL_BENEFITS.take(4).forEach { benefit ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .neumorphicDualShadow(
                        darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.40f),
                        lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.30f) else Color.White.copy(alpha = 0.85f),
                        blurRadius = 6.dp,
                        offset = 3.dp,
                        cornerRadius = 18.dp,
                        inset = false
                    )
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (isDark) Color(0xFF191C1E) else Color.White)
                    .padding(20.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isDark) MindfulCardBgDark else MindfulCardBgLight),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = benefit.icon),
                                contentDescription = benefit.title,
                                tint = if (isDark) benefit.iconColorDark else benefit.iconColorLight,
                                modifier = Modifier.size(26.dp)
                            )
                        }
                        Column {
                            Text(
                                text = benefit.tagline.uppercase(),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp,
                                color = if (isDark) BrandBlueDark else BrandBluePrimary
                            )
                            Text(
                                text = benefit.title,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isDark) TextPrimaryDark else TextPrimaryLight
                            )
                        }
                    }
                    Text(
                        text = benefit.description,
                        fontSize = 14.sp,
                        lineHeight = 22.sp,
                        color = if (isDark) TextMutedDark else Color(0xFF5A626F)
                    )
                }
            }
        }

        GotItButton(isDark = isDark, label = "Start Practicing", onClick = {})
    }
}

@Composable
private fun GotItButton(isDark: Boolean, label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .fillMaxWidth()
                .height(56.dp)
                .neumorphicDualShadow(
                    darkColor = if (isDark) Color.Black.copy(alpha = 0.45f) else Color(0xFFA3B1C6).copy(alpha = 0.45f),
                    lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.35f) else Color.White.copy(alpha = 0.9f),
                    blurRadius = 7.dp,
                    offset = 3.dp,
                    cornerRadius = 28.dp,
                    inset = false
                )
                .clip(RoundedCornerShape(28.dp))
                .background(if (isDark) Color(0xFF191C1E) else Color.White)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = label,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) BrandBlueDark else BrandBluePrimary
                )
                Icon(
                    painter = painterResource(id = R.drawable.ic_lucide_check_circle_2),
                    contentDescription = null,
                    tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
