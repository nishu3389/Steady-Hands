package com.steadyhands.balance.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.steadyhands.balance.ui.components.NeuCard
import com.steadyhands.balance.ui.theme.*

data class LeaderboardEntry(
    val rank: Int,
    val name: String,
    val score: Int,
    val steps: Int,
    val waterRetained: Int
)

private val sampleLeaderboard = listOf(
    LeaderboardEntry(1, "ZenMaster_Kai", 99, 142, 99),
    LeaderboardEntry(2, "Elena_Wanderer", 97, 128, 98),
    LeaderboardEntry(3, "BreatheDeep", 95, 115, 96),
    LeaderboardEntry(4, "SteadyLotus", 91, 102, 92),
    LeaderboardEntry(5, "BambooStride", 88, 95, 89),
    LeaderboardEntry(6, "MindfulMonk", 86, 84, 87),
    LeaderboardEntry(7, "TranquilPacer", 83, 79, 84),
    LeaderboardEntry(8, "OceanStillness", 80, 72, 81)
)

@Composable
fun LeaderboardScreen() {
    val isDark = isSystemInDarkTheme()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Steadiness Rankings",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
        )

        Text(
            text = "Top practitioners maintaining perfect stillness and fluid cadence.",
            style = MaterialTheme.typography.bodyMedium,
            color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary,
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        // Podium Top 3
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.Bottom
        ) {
            PodiumCard(sampleLeaderboard[1], 2, Color(0xFFC0C0C0), 100.dp) // Silver
            PodiumCard(sampleLeaderboard[0], 1, ZenGoldKintsugi, 120.dp)   // Gold
            PodiumCard(sampleLeaderboard[2], 3, Color(0xFFCD7F32), 90.dp)  // Bronze
        }

        // Rest of the list
        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            itemsIndexed(sampleLeaderboard.drop(3)) { _, entry ->
                NeuCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "#${entry.rank}",
                                fontWeight = FontWeight.Bold,
                                color = ZenTealPrimary,
                                modifier = Modifier.width(36.dp)
                            )
                            Column {
                                Text(
                                    text = entry.name,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
                                )
                                Text(
                                    text = "${entry.steps} steps • ${entry.waterRetained}% retained",
                                    fontSize = 12.sp,
                                    color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary
                                )
                            }
                        }

                        Text(
                            text = "${entry.score}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = ZenTealPrimary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PodiumCard(entry: LeaderboardEntry, rank: Int, badgeColor: Color, height: androidx.compose.ui.unit.Dp) {
    val isDark = isSystemInDarkTheme()
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(badgeColor.copy(alpha = 0.2f))
                .border(1.5.dp, badgeColor, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.EmojiEvents,
                contentDescription = null,
                tint = badgeColor,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = entry.name,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            maxLines = 1
        )

        Spacer(modifier = Modifier.height(4.dp))

        Box(
            modifier = Modifier
                .width(84.dp)
                .height(height)
                .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                .background(if (isDark) ZenDarkCard else ZenLightCard)
                .border(1.dp, if (isDark) ZenDarkBorder else ZenLightBorder, RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "#$rank",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = badgeColor
                )
                Text(
                    text = "${entry.score} pts",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = ZenTealPrimary
                )
            }
        }
    }
}
