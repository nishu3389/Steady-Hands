package com.steadyhands.balance.data

import androidx.annotation.DrawableRes
import androidx.compose.ui.graphics.Color
import com.steadyhands.balance.R

data class MindfulBenefit(
    val id: Int,
    @param:DrawableRes val icon: Int,
    val iconColorLight: Color,
    val iconColorDark: Color,
    val title: String,
    val tagline: String,
    val description: String
)

val MINDFUL_BENEFITS = listOf(
    MindfulBenefit(
        id = 1,
        icon = R.drawable.ic_lucide_brain,
        iconColorLight = Color(0xFF005F9E),
        iconColorDark = Color(0xFF9DCAFF),
        title = "Laser-Sharp Focus",
        tagline = "Attention Span",
        description = "Stabilizing the bowl demands active, undivided presence, retraining the prefrontal cortex to resist digital distractions."
    ),
    MindfulBenefit(
        id = 2,
        icon = R.drawable.ic_lucide_heart_pulse,
        iconColorLight = Color(0xFF9A3412),
        iconColorDark = Color(0xFFFFB4A0),
        title = "Nervous System Calming",
        tagline = "Stress Reduction",
        description = "Slow, controlled movements stimulate the vagus nerve, shifting your body from sympathetic fight-or-flight to restful parasympathetic calm."
    ),
    MindfulBenefit(
        id = 3,
        icon = R.drawable.ic_lucide_compass,
        iconColorLight = Color(0xFF007A6C),
        iconColorDark = Color(0xFF66DBCB),
        title = "Proprioception & Balance",
        tagline = "Body Awareness",
        description = "Real-time tilt feedback sharpens somatic sensory integration, improving spatial balance and fine motor coordination."
    ),
    MindfulBenefit(
        id = 4,
        icon = R.drawable.ic_lucide_wind,
        iconColorLight = Color(0xFF0284C7),
        iconColorDark = Color(0xFF7DD3FC),
        title = "Natural Breath Regulation",
        tagline = "Breathwork",
        description = "Keeping hands steady instinctively deepens diaphragmatic breathing, oxygenating the brain and stabilizing heart rate."
    ),
    MindfulBenefit(
        id = 5,
        icon = R.drawable.ic_lucide_zap,
        iconColorLight = Color(0xFFD97706),
        iconColorDark = Color(0xFFFDE047),
        title = "Effortless Flow State",
        tagline = "Cognitive Flow",
        description = "The tight loop between physical motion and instant visual feedback rapidly pulls the mind into deep, immersive flow."
    ),
    MindfulBenefit(
        id = 6,
        icon = R.drawable.ic_lucide_eye,
        iconColorLight = Color(0xFF7C3AED),
        iconColorDark = Color(0xFFC4B5FD),
        title = "Sensory Reset from Screen Fatigue",
        tagline = "Mental Rest",
        description = "Replaces passive scrolling with active physical micro-engagement, relieving digital eye strain and cognitive overload."
    ),
    MindfulBenefit(
        id = 7,
        icon = R.drawable.ic_lucide_shield_check,
        iconColorLight = Color(0xFF059669),
        iconColorDark = Color(0xFF6EE7B7),
        title = "Emotional Self-Regulation",
        tagline = "Impulse Control",
        description = "Learning to recover smoothly from water wobbles builds emotional composure and resilience under micro-stress."
    ),
    MindfulBenefit(
        id = 8,
        icon = R.drawable.ic_lucide_activity,
        iconColorLight = Color(0xFFE11D48),
        iconColorDark = Color(0xFFFDA4AF),
        title = "Postural Alignment",
        tagline = "Physical Health",
        description = "Balancing a virtual bowl while walking naturally corrects slouched shoulders and encourages upright spine alignment."
    ),
    MindfulBenefit(
        id = 9,
        icon = R.drawable.ic_lucide_feather,
        iconColorLight = Color(0xFF0891B2),
        iconColorDark = Color(0xFF67E8F9),
        title = "Active Zen Walking (Kinhin)",
        tagline = "Somatic Meditation",
        description = "Inspired by Buddhist walking meditation, translating physical steps into grounding mindfulness in motion."
    ),
    MindfulBenefit(
        id = 10,
        icon = R.drawable.ic_lucide_battery_charging,
        iconColorLight = Color(0xFFCA8A04),
        iconColorDark = Color(0xFFFEF08A),
        title = "Mental Energy Recharge",
        tagline = "Cognitive Renewal",
        description = "A quick 30-second balancing break clears mental fog and restores cognitive agility between demanding tasks."
    ),
    MindfulBenefit(
        id = 11,
        icon = R.drawable.ic_lucide_smile,
        iconColorLight = Color(0xFF16A34A),
        iconColorDark = Color(0xFF86EFAC),
        title = "Anxiety Release",
        tagline = "Tension Relief",
        description = "Grounding physical awareness in the fingertips discharges physical tremors and nervous tension stored in the body."
    ),
    MindfulBenefit(
        id = 12,
        icon = R.drawable.ic_lucide_sparkles,
        iconColorLight = Color(0xFF9333EA),
        iconColorDark = Color(0xFFD8B4FE),
        title = "Neuroplasticity & Motor Memory",
        tagline = "Brain Plasticity",
        description = "Adapting to dynamic spill boundaries stimulates cerebellum pathways responsible for fine motor learning."
    )
)
