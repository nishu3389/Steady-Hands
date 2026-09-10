package com.steadyhands.balance

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.steadyhands.balance.ui.SteadyHandsApp
import com.steadyhands.balance.ui.theme.SteadyHandsTheme

class ComposeMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SteadyHandsTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SteadyHandsApp()
                }
            }
        }
    }
}
