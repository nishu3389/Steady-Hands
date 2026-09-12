package com.steadyhands.balance.ui.screens

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.steadyhands.balance.MainActivity
import com.steadyhands.balance.ui.components.AdMobBannerAd
import com.steadyhands.balance.ui.components.DifficultySelector
import com.steadyhands.balance.ui.components.DurationSelector
import com.steadyhands.balance.ui.components.HomeRecordCard
import com.steadyhands.balance.ui.components.MindfulCarouselCard
import com.steadyhands.balance.ui.components.StartButtonOrbit
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

// Tapping Start shows the web app's own gameplay screen (GameStandalone.tsx)
// full-screen instead of running a session natively -- this composable is
// just the lobby (record card, dial, difficulty/duration pickers).
@Composable
fun PlayScreen(
    onOpenTutorial: () -> Unit
) {
    val context = LocalContext.current
    var selectedDifficulty by remember { mutableStateOf("medium") }
    var selectedDurationSec by remember { mutableStateOf(60) }

    val recordScore = when (selectedDifficulty.lowercase()) {
        "easy" -> 99
        "medium" -> 99
        "hard" -> 95
        else -> 99
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .widthIn(max = 420.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Best Steadiness Record Card
        HomeRecordCard(
            difficulty = selectedDifficulty,
            recordScore = recordScore
        )

        // 2. Collapsible Mindful Health Card with Sequential Carousel
        MindfulCarouselCard()

        // 3. Center Stylish Start Button with Ambient Glow & Rotating Orbit
        StartButtonOrbit(
            durationSec = selectedDurationSec,
            difficulty = selectedDifficulty,
            onStartClick = { launchWebGame(context) },
            modifier = Modifier.padding(vertical = 4.dp)
        )

        // 4. Difficulty Selector (Easy, Medium, Hard)
        DifficultySelector(
            selectedDifficulty = selectedDifficulty,
            onSelectDifficulty = { selectedDifficulty = it }
        )

        // 5. Duration Selector (45s, 60s, 90s)
        DurationSelector(
            selectedDurationSec = selectedDurationSec,
            onSelectDurationSec = { selectedDurationSec = it }
        )

        // 6. Real Google AdMob Banner (home placement)
        AdMobBannerAd()

        Spacer(modifier = Modifier.height(24.dp))
    }
}

private fun launchWebGame(context: Context) {
    val intent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra(MainActivity.EXTRA_OPEN_GAME, true)
    }
    context.startActivity(intent)
}
