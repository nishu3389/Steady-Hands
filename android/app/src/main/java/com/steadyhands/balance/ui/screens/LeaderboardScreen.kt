package com.steadyhands.balance.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.R
import com.steadyhands.balance.ui.components.SegmentActivePill
import com.steadyhands.balance.ui.components.SegmentedTrack
import com.steadyhands.balance.ui.components.neumorphicDualShadow
import com.steadyhands.balance.ui.theme.*

private enum class RankDifficulty { EASY, MED, HARD }

private data class RankEntry(
    val rank: Int,
    val name: String,
    val initials: String,
    val score: Double,
    val difficulty: RankDifficulty,
    val streakDays: Int? = null,
    val lastPlayed: String? = null,
    val isUser: Boolean = false
)

// Static sample roster matching the reference design — this native app has
// no live backend sync yet, same "seed data" approach the web build falls
// back to before a player has ever recorded a real score.
private val SAMPLE_ENTRIES = listOf(
    RankEntry(1, "Aarav Sharma", "AS", 99.1, RankDifficulty.HARD, streakDays = 18),
    RankEntry(2, "You", "AS", 99.0, RankDifficulty.MED, isUser = true),
    RankEntry(3, "Priya Patel", "PP", 98.3, RankDifficulty.MED, streakDays = 11),
    RankEntry(4, "Rohan Verma", "RV", 97.5, RankDifficulty.HARD, streakDays = 6),
    RankEntry(5, "Ananya Iyer", "AI", 96.2, RankDifficulty.MED, streakDays = 5),
    RankEntry(6, "Vikram Singh", "VS", 94.8, RankDifficulty.EASY, lastPlayed = "2d ago"),
    RankEntry(7, "Diya Gupta", "DG", 93.4, RankDifficulty.MED, lastPlayed = "1d ago")
)

@Composable
fun LeaderboardScreen(onPlayNow: () -> Unit = {}) {
    val isDark = resolveIsDarkTheme()
    var difficultyFilter by remember { mutableStateOf<RankDifficulty?>(null) }

    val filteredEntries = remember(difficultyFilter) {
        if (difficultyFilter == null) SAMPLE_ENTRIES
        else SAMPLE_ENTRIES.filter { it.difficulty == difficultyFilter }
    }
    val podium = filteredEntries.take(3)
    val contenders = filteredEntries.drop(3)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .widthIn(max = 420.dp)
    ) {
        // ---- Header ----
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Leaderboard",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isDark) TextPrimaryDark else TextPrimaryLight
                    )
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (isDark) Color(0xFF38BDF8) else Color(0xFF0EA5E9))
                    )
                }
                Text(
                    text = "BODY STEADINESS RANKINGS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.55.sp,
                    color = if (isDark) TextMutedDark else TextSecondaryLight
                )
            }

            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(if (isDark) Color(0xFF162B3B) else Color(0xFFE9EDF2))
                    // Same sunken dual-shadow depth as the ALL/EASY/MED/HARD
                    // filter track.
                    .neumorphicDualShadow(
                        darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.45f),
                        lightColor = if (isDark) Color(0xFF2E363F).copy(alpha = 0.40f) else Color.White.copy(alpha = 0.85f),
                        blurRadius = 6.dp,
                        offset = 3.dp,
                        cornerRadius = 17.dp,
                        inset = true
                    )
                    .padding(horizontal = 12.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF10B981))
                )
                Text(
                    text = "Live Sync",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isDark) TextSecondaryDark else TextSecondaryLight
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // ---- Active walkers + reset timer ----
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isDark) Color(0xFF191C1E) else Color.White)
                    .border(1.dp, if (isDark) Color.White.copy(alpha = 0.05f) else Color.Black.copy(alpha = 0.04f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Text(text = "👥", fontSize = 12.sp)
                Text(
                    text = "4,200 Walkers Active",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) TextSecondaryDark else TextSecondaryLight
                )
            }

            Text(
                text = "Reset in 1d 19h",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = if (isDark) BrandBlueDark else BrandBluePrimary,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isDark) Color(0xFF0C4A6E).copy(alpha = 0.5f) else Color(0xFFE0F2FE))
                    .border(1.dp, (if (isDark) BrandBlueDark else BrandBluePrimary).copy(alpha = 0.20f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // ---- Difficulty filter ----
        SegmentedTrack(modifier = Modifier.fillMaxWidth(), cornerRadius = 16.dp, isDark = isDark) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                RankFilterOption(Modifier.weight(1f), "ALL", difficultyFilter == null, isDark) { difficultyFilter = null }
                RankFilterOption(Modifier.weight(1f), "EASY", difficultyFilter == RankDifficulty.EASY, isDark) { difficultyFilter = RankDifficulty.EASY }
                RankFilterOption(Modifier.weight(1f), "MED", difficultyFilter == RankDifficulty.MED, isDark) { difficultyFilter = RankDifficulty.MED }
                RankFilterOption(Modifier.weight(1f), "HARD", difficultyFilter == RankDifficulty.HARD, isDark) { difficultyFilter = RankDifficulty.HARD }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // ---- Podium ----
        if (podium.isNotEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .neumorphicDualShadow(
                        darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.40f),
                        lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.30f) else Color.White.copy(alpha = 0.85f),
                        blurRadius = 7.dp,
                        offset = 3.dp,
                        cornerRadius = 24.dp,
                        inset = false
                    )
                    .clip(RoundedCornerShape(24.dp))
                    .background(if (isDark) Color(0xFF191C1E) else Color.White)
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    PodiumSlot(modifier = Modifier.weight(1f), entry = podium.getOrNull(1), place = 2, isDark = isDark)
                    PodiumSlot(modifier = Modifier.weight(1.05f), entry = podium.getOrNull(0), place = 1, isDark = isDark)
                    PodiumSlot(modifier = Modifier.weight(1f), entry = podium.getOrNull(2), place = 3, isDark = isDark)
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // ---- Your Rank insight card ----
        val userIndex = filteredEntries.indexOfFirst { it.isUser }
        if (userIndex != -1) {
            val me = filteredEntries[userIndex]
            val personAbove = if (userIndex > 0) filteredEntries[userIndex - 1] else null

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (isDark) Color(0xFF162B3B).copy(alpha = 0.5f) else Color(0xFFE9EDF2))
                    // Same sunken dual-shadow depth as the ALL/EASY/MED/HARD
                    // filter track.
                    .neumorphicDualShadow(
                        darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.45f),
                        lightColor = if (isDark) Color(0xFF2E363F).copy(alpha = 0.40f) else Color.White.copy(alpha = 0.85f),
                        blurRadius = 6.dp,
                        offset = 3.dp,
                        cornerRadius = 18.dp,
                        inset = true
                    )
                    .padding(14.dp)
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF97316).copy(alpha = 0.12f))
                            .border(1.dp, Color(0xFFF97316).copy(alpha = 0.30f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "🔥", fontSize = 16.sp)
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (userIndex == 0) "You're #1 right now!" else "Your Rank: #${userIndex + 1}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.2).sp,
                            color = if (isDark) TextPrimaryDark else TextPrimaryLight
                        )
                        Text(
                            text = "${(difficultyFilter?.name ?: me.difficulty.name).let { if (it == "MED") "MEDIUM" else it }} Mode",
                            fontSize = 11.sp,
                            color = if (isDark) TextMutedDark else TextSecondaryLight
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(if (isDark) Color.White.copy(alpha = 0.06f) else Color.Black.copy(alpha = 0.06f)))
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            if (personAbove != null) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.weight(1f)) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_lucide_target),
                                        contentDescription = null,
                                        tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    val behindColor = if (isDark) Color(0xFF7DD3FC) else Color(0xFF0369A1)
                                    Text(
                                        text = buildAnnotatedString {
                                            withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = behindColor)) {
                                                append(String.format("%.1f", (personAbove.score - me.score).coerceAtLeast(0.1)))
                                                append("% behind")
                                            }
                                            append(" ")
                                            append(personAbove.name)
                                            append(" for rank #$userIndex")
                                        },
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (isDark) TextSecondaryDark else TextSecondaryLight
                                    )
                                }
                            } else {
                                Text(
                                    text = "Keep it up to stay in the lead.",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (isDark) TextSecondaryDark else TextSecondaryLight,
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(2.dp),
                                modifier = Modifier.clip(RoundedCornerShape(8.dp)).clickable(onClick = onPlayNow).padding(4.dp)
                            ) {
                                Text(text = "Play Now", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isDark) BrandBlueDark else BrandBluePrimary)
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_lucide_chevron_right),
                                    contentDescription = null,
                                    tint = if (isDark) BrandBlueDark else BrandBluePrimary,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))
        }

        // ---- Contenders ----
        if (contenders.isNotEmpty()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    text = "CONTENDERS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 0.8.sp,
                    color = if (isDark) TextSecondaryDark else TextSecondaryLight
                )
                Text(
                    text = "Steadiness Score",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isDark) TextMutedDark else TextSecondaryLight
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                contenders.forEachIndexed { idx, entry ->
                    ContenderRow(entry = entry, rankNumber = idx + 4, isDark = isDark)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun RankFilterOption(
    modifier: Modifier,
    label: String,
    isActive: Boolean,
    isDark: Boolean,
    onClick: () -> Unit
) {
    val text = @Composable {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp,
            color = if (isActive) {
                if (isDark) BrandBlueDark else BrandBluePrimary
            } else {
                if (isDark) TextSecondaryDark else TextSecondaryLight
            },
            modifier = androidx.compose.ui.Modifier.padding(vertical = 8.dp)
        )
    }
    if (isActive) {
        SegmentActivePill(modifier = modifier, cornerRadius = 12.dp, isDark = isDark) {
            Box(contentAlignment = Alignment.Center) { text() }
        }
    } else {
        Box(
            modifier = modifier.clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) { text() }
    }
}

@Composable
private fun PodiumSlot(modifier: Modifier, entry: RankEntry?, place: Int, isDark: Boolean) {
    if (entry == null) {
        Box(modifier = modifier)
        return
    }

    val ringBrush = when (place) {
        1 -> Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFFEF08A), Color(0xFFB45309)))
        2 -> Brush.linearGradient(listOf(Color(0xFF94A3B8), Color(0xFFE2E8F0), Color(0xFF64748B)))
        else -> Brush.linearGradient(listOf(Color(0xFFB45309), Color(0xFFFDBA74), Color(0xFF9A3412)))
    }
    val badgeBg = when (place) {
        1 -> Color(0xFFF59E0B)
        2 -> Color(0xFF94A3B8)
        else -> Color(0xFFEA580C)
    }
    val avatarSize = if (place == 1) 68.dp else 56.dp
    val platformHeight = if (place == 1) 96.dp else if (place == 2) 64.dp else 48.dp
    val scoreColor = when (place) {
        1 -> if (isDark) Color(0xFFFCD34D) else Color(0xFFD97706)
        else -> if (isDark) TextPrimaryDark else TextPrimaryLight
    }
    // Per-medal initials styling, matching the web exactly: #1 is heavier
    // and amber-tinted, #2/#3 are a normal bold weight in slate/orange.
    val initialsWeight = if (place == 1) FontWeight.ExtraBold else FontWeight.Bold
    val initialsColor = when (place) {
        1 -> if (isDark) Color(0xFFFCD34D) else Color(0xFFD97706)
        2 -> if (isDark) Color(0xFFE2E8F0) else Color(0xFF1E293B)
        else -> if (isDark) Color(0xFFFED7AA) else Color(0xFFEA580C)
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier.offset(y = if (place == 1) (-8).dp else 0.dp)
    ) {
        if (place == 1) {
            Icon(
                painter = painterResource(id = R.drawable.ic_lucide_trophy),
                contentDescription = null,
                tint = Color(0xFFF59E0B),
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.height(2.dp))
        } else if (place == 3 && entry.streakDays != null) {
            Text(
                text = "🔥 ${entry.streakDays}d streak",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFEA580C),
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0xFFEA580C).copy(alpha = 0.12f))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
        }

        Box(contentAlignment = Alignment.BottomCenter) {
            Box(
                modifier = Modifier
                    .size(avatarSize)
                    .clip(CircleShape)
                    .background(ringBrush)
                    .padding(2.dp)
                    .clip(CircleShape)
                    .background(if (isDark) Color(0xFF1C2127) else Color(0xFFF8FAFC)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = entry.initials,
                    fontSize = if (place == 1) 18.sp else 15.sp,
                    fontWeight = initialsWeight,
                    color = initialsColor
                )
            }
            Box(
                modifier = Modifier
                    .offset(y = 8.dp)
                    .size(if (place == 1) 22.dp else 18.dp)
                    .clip(CircleShape)
                    .background(badgeBg),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "$place", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White)
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(
                text = if (entry.isUser) "You" else entry.name,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                textAlign = TextAlign.Center,
                // Web hard-codes the #2 slot's name as sky-blue regardless of
                // who occupies it (not just when it's the user) — replicated
                // as-is rather than "fixed" to only color it for isUser.
                color = if (place == 2 || entry.isUser) {
                    if (isDark) BrandBlueDark else BrandBluePrimary
                } else {
                    if (isDark) TextPrimaryDark else TextPrimaryLight
                }
            )
            if (entry.isUser) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_lucide_crown),
                    contentDescription = null,
                    tint = Color(0xFFF59E0B),
                    modifier = Modifier.size(11.dp)
                )
            }
        }

        Text(
            text = "${entry.score}%",
            fontSize = if (place == 1) 16.sp else 14.sp,
            fontFamily = MontserratFontFamily,
            fontWeight = FontWeight.Black,
            color = scoreColor
        )

        Spacer(modifier = Modifier.height(4.dp))
        DifficultyBadge(entry.difficulty)

        if (place == 1 && entry.streakDays != null) {
            Spacer(modifier = Modifier.height(3.dp))
            Text(text = "🔥 ${entry.streakDays}d", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEA580C))
        }

        Spacer(modifier = Modifier.height(10.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(platformHeight)
                .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                .background(
                    if (place == 1) {
                        Brush.verticalGradient(listOf(Color(0xFFFEF3C7), Color(0xFFFDE68A).copy(alpha = 0.5f)))
                    } else {
                        Brush.verticalGradient(
                            listOf(
                                if (isDark) Color(0xFF20262D) else Color(0xFFE9EDF2),
                                if (isDark) Color(0xFF181C21) else Color(0xFFDCE2EA)
                            )
                        )
                    }
                )
                // Same sunken dual-shadow depth as the ALL/EASY/MED/HARD
                // filter track.
                .neumorphicDualShadow(
                    darkColor = if (isDark) Color.Black.copy(alpha = 0.40f) else Color(0xFFA3B1C6).copy(alpha = 0.45f),
                    lightColor = if (isDark) Color(0xFF2E363F).copy(alpha = 0.40f) else Color.White.copy(alpha = 0.85f),
                    blurRadius = 6.dp,
                    offset = 3.dp,
                    cornerRadius = 12.dp,
                    inset = true
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = when (place) { 1 -> "1st"; 2 -> "2nd"; else -> "3rd" },
                    fontSize = if (place == 1) 12.sp else 10.sp,
                    fontWeight = if (place == 1) FontWeight.Black else FontWeight.Bold,
                    color = if (place == 1) Color(0xFFB45309) else (if (isDark) TextMutedDark else TextSecondaryLight)
                )
                if (place == 1) {
                    Text(
                        text = "LEADER",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.8.sp,
                        color = if (isDark) TextMutedDark else TextSecondaryLight
                    )
                }
            }
        }
    }
}

@Composable
private fun DifficultyBadge(difficulty: RankDifficulty) {
    val (bg, text, label) = when (difficulty) {
        RankDifficulty.EASY -> Triple(Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF059669), "EASY")
        RankDifficulty.MED -> Triple(Color(0xFF0EA5E9).copy(alpha = 0.15f), Color(0xFF0284C7), "MED")
        RankDifficulty.HARD -> Triple(Color(0xFFF59E0B).copy(alpha = 0.18f), Color(0xFFB45309), "HARD")
    }
    Text(
        text = label,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        color = text,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bg)
            .padding(horizontal = 6.dp, vertical = 2.dp)
    )
}

@Composable
private fun ContenderRow(entry: RankEntry, rankNumber: Int, isDark: Boolean) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .neumorphicDualShadow(
                darkColor = if (isDark) Color.Black.copy(alpha = 0.35f) else Color(0xFFA3B1C6).copy(alpha = 0.35f),
                lightColor = if (isDark) Color(0xFF3A4550).copy(alpha = 0.25f) else Color.White.copy(alpha = 0.80f),
                blurRadius = 5.dp,
                offset = 2.dp,
                cornerRadius = 18.dp,
                inset = false
            )
            .clip(RoundedCornerShape(18.dp))
            .background(if (isDark) Color(0xFF191C1E) else Color.White)
            .padding(14.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(Color(0xFFCBD5E1), Color(0xFF94A3B8)))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "$rankNumber", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF1E293B))
                }

                Column {
                    Text(
                        text = if (entry.isUser) "You" else entry.name,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.2).sp,
                        color = if (isDark) TextPrimaryDark else TextPrimaryLight
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        DifficultyBadge(entry.difficulty)
                        Text(text = "•", color = if (isDark) TextMutedDark else TextSecondaryLight, fontSize = 11.sp)
                        if (entry.streakDays != null) {
                            Text(text = "🔥 ${entry.streakDays}d streak", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEA580C))
                        } else {
                            Text(
                                text = "Last played: ${entry.lastPlayed ?: "—"}",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Medium,
                                color = if (isDark) TextMutedDark else TextSecondaryLight
                            )
                        }
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(text = "${entry.score}", fontSize = 16.sp, fontFamily = MontserratFontFamily, fontWeight = FontWeight.Black, color = if (isDark) TextPrimaryDark else TextPrimaryLight)
                    Text(text = "%", fontSize = 12.sp, color = if (isDark) TextMutedDark else TextSecondaryLight)
                }
                Text(
                    text = "STEADINESS",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    color = if (isDark) TextMutedDark else TextSecondaryLight
                )
            }
        }
    }
}
