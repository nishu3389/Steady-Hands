package com.steadyhands.balance.ui.screens

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.steadyhands.balance.ui.components.NeuCard
import com.steadyhands.balance.ui.theme.*

@Composable
fun InstructionsScreen(
    onReplayTutorial: () -> Unit
) {
    val isDark = isSystemInDarkTheme()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Mindful Walking Guide",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
        )

        Button(
            onClick = onReplayTutorial,
            colors = ButtonDefaults.buttonColors(containerColor = ZenTealPrimary),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.PlayCircle, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Replay Animated Tutorial", fontWeight = FontWeight.Bold)
        }

        InstructionCard(
            icon = Icons.Default.SelfImprovement,
            title = "1. Posture & Grip",
            desc = "Hold the phone flat with both thumbs resting lightly on the sides. Relax your shoulders and soften your gaze forward rather than staring down intently."
        )

        InstructionCard(
            icon = Icons.Default.Speed,
            title = "2. The Gliding Gait (Kinhin)",
            desc = "Traditional Zen walking meditation involves placing the heel down first, rolling smoothly onto the ball of the foot, and pushing off quietly with zero abrupt vertical bounce."
        )

        InstructionCard(
            icon = Icons.Default.Waves,
            title = "3. Stillness in Motion",
            desc = "If liquid begins to oscillate toward the rim, slow your cadence or pause entirely for one full inhale and exhale. Let the surface tension settle before resuming."
        )
    }
}

@Composable
private fun InstructionCard(icon: ImageVector, title: String, desc: String) {
    val isDark = isSystemInDarkTheme()

    NeuCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = ZenTealPrimary,
                modifier = Modifier.size(28.dp)
            )
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isDark) ZenDarkTextPrimary else ZenLightTextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isDark) ZenDarkTextSecondary else ZenLightTextSecondary
                )
            }
        }
    }
}
