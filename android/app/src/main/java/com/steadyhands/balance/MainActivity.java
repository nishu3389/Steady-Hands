package com.steadyhands.balance;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Read by EngineSwitchPlugin.getLaunchOptions() so the web app can decide,
    // on boot, to render only the tutorial screen instead of the full app shell.
    public static final String EXTRA_OPEN_TUTORIAL = "open_tutorial";
    // Same idea, but for jumping straight into the web gameplay screen.
    public static final String EXTRA_OPEN_GAME = "open_game";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocationResolverPlugin.class);
        registerPlugin(NetworkRegionPlugin.class);
        registerPlugin(EngineSwitchPlugin.class);
        super.onCreate(savedInstanceState);
        // The vertical line seen on the right edge while scrolling is
        // Android's native WebView scrollbar overlay — it's drawn by the
        // OS/View system, not the page's CSS, so `::-webkit-scrollbar` rules
        // in index.css can't touch it. Disabling it here is the actual fix.
        getBridge().getWebView().setVerticalScrollBarEnabled(false);
        getBridge().getWebView().setHorizontalScrollBarEnabled(false);
    }
}
