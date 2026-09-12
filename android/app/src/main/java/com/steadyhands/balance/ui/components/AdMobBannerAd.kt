package com.steadyhands.balance.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView

// Same "home placement" banner ad unit used by the web/Capacitor build
// (src/services/adMobService.ts) — one real ad slot shared across platforms.
private const val HOME_BANNER_AD_UNIT_ID = "ca-app-pub-4833668827116420/8214685836"

/**
 * Real Google AdMob banner, sized as an adaptive anchored banner matching the
 * lobby's own width — replaces the earlier hand-drawn "AdMimicCard"
 * placeholder with an actual ad served by Google.
 */
@Composable
fun AdMobBannerAd(modifier: Modifier = Modifier) {
    val context = LocalContext.current

    AndroidView(
        modifier = modifier
            .fillMaxWidth()
            .wrapContentHeight(),
        factory = { ctx ->
            val displayMetrics = ctx.resources.displayMetrics
            val adWidthDp = (displayMetrics.widthPixels / displayMetrics.density).toInt()
            val adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(ctx, adWidthDp)

            AdView(ctx).apply {
                adUnitId = HOME_BANNER_AD_UNIT_ID
                setAdSize(adSize)
                loadAd(AdRequest.Builder().build())
            }
        }
    )
}
