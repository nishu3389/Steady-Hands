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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

    val cardBgGradient = if (isDark) {
        Brush.linearGradient(
            colors = listOf(Color(0xFF22262B), Color(0xFF181B1E)),
            start = Offset(0f, 0f),
            end = Offset(400f, 400f)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xFFFFFFFF), Color(0xFFF0F4F8)),
            start = Offset(0f, 0f),
            end = Offset(400f, 400f)
        )
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = if (isDark) 5.dp else 8.dp,
                shape = RoundedCornerShape(20.dp),
                ambientColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.55f),
                spotColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.55f)
            )
            .clip(RoundedCornerShape(20.dp))
            .background(cardBgGradient)
            .border(
                width = 1.dp,
                color = if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.90f),
                shape = RoundedCornerShape(20.dp)
            )
            .padding(vertical = 18.dp, horizontal = 20.dp),
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
                color = if (isDark) TextSecondaryDark else TextSecondaryLight
            )

            Spacer(modifier = Modifier.height(3.dp))

            // Score with % sign and subtle gradient drop shadow
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "$recordScore",
                    fontSize = 48.sp,
                    lineHeight = 52.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isDark) BrandBlueDark else BrandBluePrimary,
                    letterSpacing = (-1).sp
                )
                Text(
                    text = "%",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) BrandBlueDark else BrandBluePrimary,
                    modifier = Modifier.padding(bottom = 6.dp, start = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(3.dp))

            // Subtitle
            Text(
                text = "Body & Posture Stability",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.5.sp,
                color = if (isDark) TextMutedDark else TextMutedLight
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
        // Toggle Button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(if (isDark) MindfulCardBgDark else MindfulCardBgLight)
                .border(
                    width = 1.dp,
                    color = if (isDark) BrandBlueDark.copy(alpha = 0.20f) else BrandBluePrimary.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(16.dp)
                )
                .clickable { isExpanded = !isExpanded }
                .padding(horizontal = 14.dp, vertical = 11.dp)
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
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "Why Steady Hands? (${activeIndex + 1}/${MINDFUL_BENEFITS.size} Mind & Body)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) BrandBlueDark else BrandBluePrimary
                    )
                }

                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        // Expanded Card
        AnimatedVisibility(
            visible = isExpanded,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            val expandedGradient = if (isDark) {
                Brush.linearGradient(
                    colors = listOf(Color(0xFF22262B), Color(0xFF181B1E)),
                    start = Offset(0f, 0f),
                    end = Offset(300f, 300f)
                )
            } else {
                Brush.linearGradient(
                    colors = listOf(Color(0xFFFFFFFF), Color(0xFFF0F4F8)),
                    start = Offset(0f, 0f),
                    end = Offset(300f, 300f)
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
                    .shadow(
                        elevation = if (isDark) 5.dp else 8.dp,
                        shape = RoundedCornerShape(18.dp),
                        ambientColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.55f),
                        spotColor = if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.55f)
                    )
                    .clip(RoundedCornerShape(18.dp))
                    .background(expandedGradient)
                    .border(
                        width = 1.dp,
                        color = if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.90f),
                        shape = RoundedCornerShape(18.dp)
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
                                imageVector = currentBenefit.icon,
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
                                lineHeight = 17.sp
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
                                    imageVector = Icons.Default.ChevronLeft,
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
                                    imageVector = Icons.Default.ChevronRight,
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

    val trackGradient = if (isDark) {
        Brush.linearGradient(
            colors = listOf(Color(0xFF131A22), Color(0xFF192532))
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xFFE2E7ED), Color(0xFFEDF2F7))
        )
    }

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

        // Pill track container with Neumorphic Inset shadow & gradient
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(CircleShape)
                .background(trackGradient)
                .border(
                    width = 1.dp,
                    color = if (isDark) Color(0xFF0F172A).copy(alpha = 0.70f) else Color.White.copy(alpha = 0.70f),
                    shape = CircleShape
                )
                .padding(5.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                options.forEach { (key, label) ->
                    val isActive = selectedDifficulty.equals(key, ignoreCase = true)

                    val activeBg = if (isActive) {
                        if (isDark) {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF6B4B02), Color(0xFF533900))
                            )
                        } else {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFFFE5BA), Color(0xFFFFD794))
                            )
                        }
                    } else {
                        if (isDark) {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF23282D), Color(0xFF1A1D20))
                            )
                        } else {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFFFFFFF), Color(0xFFF7F9FC))
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .shadow(
                                elevation = if (isActive) (if (isDark) 4.dp else 3.dp) else (if (isDark) 2.dp else 4.dp),
                                shape = CircleShape,
                                ambientColor = if (isActive) {
                                    if (isDark) Color(0xFF281C00) else Color(0xFFF59E0B).copy(alpha = 0.35f)
                                } else {
                                    if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
                                },
                                spotColor = if (isActive) {
                                    if (isDark) Color(0xFF281C00) else Color(0xFFF59E0B).copy(alpha = 0.35f)
                                } else {
                                    if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
                                }
                            )
                            .clip(CircleShape)
                            .background(activeBg)
                            .border(
                                width = if (isActive) 1.dp else 1.dp,
                                color = if (isActive) {
                                    if (isDark) Color(0xFFFFDEA8).copy(alpha = 0.30f) else Color(0xFFF59E0B).copy(alpha = 0.35f)
                                } else {
                                    if (isDark) Color.White.copy(alpha = 0.06f) else Color.White.copy(alpha = 0.90f)
                                },
                                shape = CircleShape
                            )
                            .clickable { onSelectDifficulty(key) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 15.sp,
                            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
                            color = if (isActive) {
                                if (isDark) DifficultyActiveTextDark else DifficultyActiveTextLight
                            } else {
                                if (isDark) TextSecondaryDark else TextSecondaryLight
                            }
                        )
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

    val trackGradient = if (isDark) {
        Brush.linearGradient(
            colors = listOf(Color(0xFF131A22), Color(0xFF192532))
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xFFE2E7ED), Color(0xFFEDF2F7))
        )
    }

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

        // Pill track container with Neumorphic Inset shadow & gradient
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(CircleShape)
                .background(trackGradient)
                .border(
                    width = 1.dp,
                    color = if (isDark) Color(0xFF0F172A).copy(alpha = 0.70f) else Color.White.copy(alpha = 0.70f),
                    shape = CircleShape
                )
                .padding(5.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                options.forEach { (dur, label) ->
                    val isActive = selectedDurationSec == dur

                    val activeBg = if (isActive) {
                        if (isDark) {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF00558F), Color(0xFF003D69))
                            )
                        } else {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFDCEDFF), Color(0xFFC8E1FF))
                            )
                        }
                    } else {
                        if (isDark) {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF23282D), Color(0xFF1A1D20))
                            )
                        } else {
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFFFFFFF), Color(0xFFF7F9FC))
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .shadow(
                                elevation = if (isActive) (if (isDark) 5.dp else 4.dp) else (if (isDark) 2.dp else 4.dp),
                                shape = CircleShape,
                                ambientColor = if (isActive) {
                                    if (isDark) BrandBlueDark.copy(alpha = 0.40f) else BrandBluePrimary.copy(alpha = 0.45f)
                                } else {
                                    if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
                                },
                                spotColor = if (isActive) {
                                    if (isDark) BrandBlueDark.copy(alpha = 0.40f) else BrandBluePrimary.copy(alpha = 0.45f)
                                } else {
                                    if (isDark) Color(0xFF070B0E) else Color(0xFFA3B1C6).copy(alpha = 0.45f)
                                }
                            )
                            .clip(CircleShape)
                            .background(activeBg)
                            .border(
                                width = if (isActive) 1.dp else 1.dp,
                                color = if (isActive) {
                                    if (isDark) OrbitCyan.copy(alpha = 0.45f) else BrandBluePrimary.copy(alpha = 0.35f)
                                } else {
                                    if (isDark) Color.White.copy(alpha = 0.06f) else Color.White.copy(alpha = 0.90f)
                                },
                                shape = CircleShape
                            )
                            .clickable { onSelectDurationSec(dur) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 15.sp,
                            fontWeight = if (isActive) FontWeight.ExtraBold else FontWeight.Medium,
                            color = if (isActive) {
                                if (isDark) DurationActiveTextDark else DurationActiveTextLight
                            } else {
                                if (isDark) TextSecondaryDark else TextSecondaryLight
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AdMimicCard(
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // Main Ad Banner Container (Glassmorphic gradient)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = if (isDark) 4.dp else 6.dp,
                    shape = RoundedCornerShape(16.dp),
                    ambientColor = NeuDarkShadow,
                    spotColor = NeuDarkShadow
                )
                .clip(RoundedCornerShape(16.dp))
                .background(
                    if (isDark) {
                        Brush.horizontalGradient(
                            colors = listOf(
                                Color(0xFF1E1B4B).copy(alpha = 0.70f),
                                Color(0xFF312E81).copy(alpha = 0.50f)
                            )
                        )
                    } else {
                        Brush.horizontalGradient(
                            colors = listOf(
                                Color(0xFFC7D2FE).copy(alpha = 0.65f),
                                Color(0xFFE0E7FF).copy(alpha = 0.75f)
                            )
                        )
                    }
                )
                .border(
                    width = 1.dp,
                    color = if (isDark) Color(0xFF818CF8).copy(alpha = 0.35f) else Color(0xFF818CF8).copy(alpha = 0.40f),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(horizontal = 12.dp, vertical = 10.dp)
        ) {
            // AdChoices / Info pill in top-right
            Row(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = (-2).dp, y = (-2).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(3.dp),
                    color = Color.Black.copy(alpha = 0.40f)
                ) {
                    Text(
                        text = "AD",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFFA0A8B4),
                        modifier = Modifier.padding(horizontal = 3.dp, vertical = 1.dp)
                    )
                }
                Text(
                    text = "ⓘ",
                    fontSize = 10.sp,
                    color = Color(0xFF707882)
                )
            }

            // Banner Content: Icon, Title/Subtitle, and CTA Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left: Squircle Icon + Copy
                Row(
                    modifier = Modifier.weight(1f).padding(end = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // App Squircle Icon
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .shadow(2.dp, RoundedCornerShape(12.dp))
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(
                                        Color(0xFF818CF8),
                                        Color(0xFF6366F1)
                                    )
                                )
                            )
                            .border(
                                width = 1.dp,
                                color = Color.White.copy(alpha = 0.30f),
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Title & Rating/Subtitle
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Hydration & Posture Coa...",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) Color(0xFFEFF1F4) else Color(0xFF1E1B4B),
                            maxLines = 1
                        )

                        Spacer(modifier = Modifier.height(2.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Text(
                                text = "★ 4.7",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFF59E0B)
                            )
                            Text(
                                text = "· Stay refreshed, walk tal...",
                                fontSize = 10.sp,
                                color = if (isDark) Color(0xFFA0A8B4) else Color(0xFF4F46E5),
                                maxLines = 1
                            )
                        }
                    }
                }

                // Right: "Free Trial" Button
                Box(
                    modifier = Modifier
                        .shadow(
                            elevation = 3.dp,
                            shape = CircleShape,
                            ambientColor = BrandBluePrimary.copy(alpha = 0.40f),
                            spotColor = BrandBluePrimary.copy(alpha = 0.40f)
                        )
                        .clip(CircleShape)
                        .background(BrandBluePrimary)
                        .border(
                            width = 1.dp,
                            color = OrbitCyan.copy(alpha = 0.40f),
                            shape = CircleShape
                        )
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Free Trial",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.3.sp,
                        color = Color.White
                    )
                }
            }
        }

        // Bottom Placement Subtitle
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Google AdMob · home placement",
                fontSize = 9.sp,
                color = if (isDark) TextMutedDark else TextMutedLight
            )
            Text(
                text = "ID: ...8214685836",
                fontSize = 8.sp,
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                color = if (isDark) TextMutedDark.copy(alpha = 0.7f) else TextMutedLight.copy(alpha = 0.7f)
            )
        }
    }
}
