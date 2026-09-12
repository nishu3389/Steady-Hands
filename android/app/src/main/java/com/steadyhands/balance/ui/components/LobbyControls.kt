package com.steadyhands.balance.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.R
import com.steadyhands.balance.data.MINDFUL_BENEFITS
import com.steadyhands.balance.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun HomeRecordCard(
    difficulty: String,
    recordScore: Int,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val cardBg = if (isDark) Color(0xFF191C1E) else Color.White

    Box(
        modifier = modifier
            .fillMaxWidth()
            // Same raised dual-shadow neumorphism as the "Why Steady Hands"
            // pill below it — no stroke, real light/dark elevation instead
            // of a flat bordered card.
            .neumorphicDualShadow(
                darkColor = if (isDark) Color.Black.copy(alpha = 0.45f) else Color(0xFFA3B1C6).copy(alpha = 0.45f),
                lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.35f) else Color.White.copy(alpha = 0.85f),
                blurRadius = 6.dp,
                offset = 3.dp,
                cornerRadius = 16.dp,
                inset = false
            )
            .clip(RoundedCornerShape(16.dp))
            .background(cardBg)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Difficulty Label
            Text(
                text = "${difficulty.uppercase()} STEADINESS RECORD",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                color = if (isDark) Color(0xFFC0C7D3) else Color(0xFF404751)
            )

            Spacer(modifier = Modifier.height(2.dp))

            // Score with % sign
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "$recordScore",
                    fontSize = 46.sp,
                    lineHeight = 52.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary,
                    letterSpacing = (-1).sp
                )
                Text(
                    text = "%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary,
                    modifier = Modifier.padding(bottom = 6.dp, start = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Subtitle
            Text(
                text = "Body & Posture Stability",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.3.sp,
                color = if (isDark) Color(0xFFA0A8B4) else Color(0xFF707882)
            )
        }
    }
}

@Composable
fun MindfulCarouselCard(
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    var isExpanded by remember { mutableStateOf(false) }
    var activeIndex by remember { mutableIntStateOf(0) }

    // Auto-cycle through benefits every 6s when expanded
    LaunchedEffect(isExpanded) {
        if (isExpanded) {
            while (true) {
                delay(6000)
                activeIndex = (activeIndex + 1) % MINDFUL_BENEFITS.size
            }
        }
    }

    val currentBenefit = MINDFUL_BENEFITS[activeIndex]

    Column(modifier = modifier.fillMaxWidth()) {
        // Toggle Button: same raised dual-shadow neumorphism as the rest of
        // the app (SegmentActivePill / bottom nav) instead of a bordered
        // flat chip — no stroke, real light/dark elevation.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .neumorphicDualShadow(
                    darkColor = if (isDark) Color.Black.copy(alpha = 0.45f) else Color(0xFFA3B1C6).copy(alpha = 0.45f),
                    lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.35f) else Color.White.copy(alpha = 0.85f),
                    blurRadius = 6.dp,
                    offset = 3.dp,
                    cornerRadius = 16.dp,
                    inset = false
                )
                .clip(RoundedCornerShape(16.dp))
                .background(if (isDark) Color(0xFF152331) else Color(0xFFEEF4FB))
                .clickable { isExpanded = !isExpanded }
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_lucide_sparkles),
                        contentDescription = null,
                        tint = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "Why Steady Hands? (${activeIndex + 1}/${MINDFUL_BENEFITS.size} Mind & Body)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary
                    )
                }

                Icon(
                    painter = painterResource(
                        id = if (isExpanded) R.drawable.ic_lucide_chevron_up else R.drawable.ic_lucide_chevron_down
                    ),
                    contentDescription = null,
                    tint = if (isDark) Color(0xFF9DCAFF) else BrandBluePrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        // Expanded Card matching web: bg-white dark:bg-[#191c1e] card-raised rounded-2xl
        AnimatedVisibility(
            visible = isExpanded,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            val expandedBg = if (isDark) Color(0xFF191C1E) else Color.White

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
                    .shadow(
                        elevation = if (isDark) 4.dp else 8.dp,
                        shape = RoundedCornerShape(16.dp),
                        ambientColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.35f),
                        spotColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.35f)
                    )
                    .clip(RoundedCornerShape(16.dp))
                    .background(expandedBg)
                    .border(
                        width = 1.dp,
                        color = if (isDark) Color.Transparent else Color.White.copy(alpha = 0.85f),
                        shape = RoundedCornerShape(16.dp)
                    )
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Benefit Details Row
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Icon Box
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isDark) MindfulCardBgDark else MindfulCardBgLight)
                                .border(
                                    width = 1.dp,
                                    color = if (isDark) BrandBlueDark.copy(alpha = 0.15f) else BrandBluePrimary.copy(alpha = 0.10f),
                                    shape = RoundedCornerShape(12.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = currentBenefit.icon),
                                contentDescription = currentBenefit.title,
                                tint = if (isDark) currentBenefit.iconColorDark else currentBenefit.iconColorLight,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        // Text Info
                        Column(modifier = Modifier.weight(1f)) {
                            // Tagline badge
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (isDark) BrandBlueDark.copy(alpha = 0.15f) else BrandBluePrimary.copy(alpha = 0.10f)
                            ) {
                                Text(
                                    text = currentBenefit.tagline.uppercase(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp,
                                    color = if (isDark) BrandBlueDark else BrandBluePrimary,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = currentBenefit.title,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isDark) TextPrimaryDark else TextPrimaryLight
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = currentBenefit.description,
                                fontSize = 12.sp,
                                color = if (isDark) TextMutedDark else TextMutedLight,
                                lineHeight = 19.5.sp
                            )
                        }
                    }

                    // Carousel Indicators & Prev/Next Buttons
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Dots
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            MINDFUL_BENEFITS.forEachIndexed { index, _ ->
                                val isCurrent = index == activeIndex
                                Box(
                                    modifier = Modifier
                                        .height(6.dp)
                                        .width(if (isCurrent) 20.dp else 6.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (isCurrent) {
                                                if (isDark) BrandBlueDark else BrandBluePrimary
                                            } else {
                                                if (isDark) Color.White.copy(alpha = 0.20f) else Color.Black.copy(alpha = 0.15f)
                                            }
                                        )
                                        .clickable { activeIndex = index }
                                )
                            }
                        }

                        // Arrows
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            IconButton(
                                onClick = {
                                    activeIndex = (activeIndex - 1 + MINDFUL_BENEFITS.size) % MINDFUL_BENEFITS.size
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_lucide_chevron_left),
                                    contentDescription = "Previous",
                                    tint = if (isDark) TextSecondaryDark else TextSecondaryLight,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            IconButton(
                                onClick = {
                                    activeIndex = (activeIndex + 1) % MINDFUL_BENEFITS.size
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_lucide_chevron_right),
                                    contentDescription = "Next",
                                    tint = if (isDark) TextSecondaryDark else TextSecondaryLight,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DifficultySelector(
    selectedDifficulty: String,
    onSelectDifficulty: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val options = listOf("easy" to "Easy", "medium" to "Medium", "hard" to "Hard")

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // Label with uppercase tracking
        Text(
            text = "DIFFICULTY",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.2.sp,
            color = if (isDark) TextSecondaryDark else TextSecondaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )

        // Segmented track: only the active option gets a raised white pill,
        // inactive options are plain text on the soft gradient track.
        SegmentedTrack(
            modifier = Modifier.fillMaxWidth(),
            isDark = isDark
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                options.forEach { (key, label) ->
                    val isActive = selectedDifficulty.equals(key, ignoreCase = true)

                    if (isActive) {
                        SegmentActivePill(
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .clickable { onSelectDifficulty(key) },
                            isDark = isDark
                        ) {
                            Text(
                                text = label,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDark) Color(0xFFFB923C) else Color(0xFFEA580C)
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .clickable { onSelectDifficulty(key) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                color = if (isDark) TextSecondaryDark else TextPrimaryLight
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DurationSelector(
    selectedDurationSec: Int,
    onSelectDurationSec: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val options = listOf(45 to "45s", 60 to "60s", 90 to "90s")

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // Label with uppercase tracking
        Text(
            text = "DURATION",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.2.sp,
            color = if (isDark) TextSecondaryDark else TextSecondaryLight,
            modifier = Modifier.padding(start = 8.dp)
        )

        // Segmented track: only the active option gets a raised white pill,
        // inactive options are plain text on the soft gradient track.
        SegmentedTrack(
            modifier = Modifier.fillMaxWidth(),
            isDark = isDark
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                options.forEach { (dur, label) ->
                    val isActive = selectedDurationSec == dur

                    if (isActive) {
                        SegmentActivePill(
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .clickable { onSelectDurationSec(dur) },
                            isDark = isDark
                        ) {
                            Text(
                                text = label,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isDark) Color(0xFF60A5FA) else Color(0xFF2F8FE0)
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .clickable { onSelectDurationSec(dur) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                color = if (isDark) TextSecondaryDark else TextPrimaryLight
                            )
                        }
                    }
                }
            }
        }
    }
}

