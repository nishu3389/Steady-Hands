package com.steadyhands.balance;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocationResolverPlugin.class);
        super.onCreate(savedInstanceState);
        // The vertical line seen on the right edge while scrolling is
        // Android's native WebView scrollbar overlay — it's drawn by the
        // OS/View system, not the page's CSS, so `::-webkit-scrollbar` rules
        // in index.css can't touch it. Disabling it here is the actual fix.
        getBridge().getWebView().setVerticalScrollBarEnabled(false);
        getBridge().getWebView().setHorizontalScrollBarEnabled(false);
    }
}
