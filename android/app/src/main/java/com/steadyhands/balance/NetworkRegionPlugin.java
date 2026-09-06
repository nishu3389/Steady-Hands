package com.steadyhands.balance;

import android.content.Context;
import android.telephony.TelephonyManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Reads the phone's current country straight from the cellular network/SIM,
// via TelephonyManager -- no location permission or GPS fix required, and it
// reflects where the phone is actually registered right now (so it also
// tracks correctly while roaming), unlike a guess from the device's
// timezone/clock setting. Neither of these TelephonyManager methods needs a
// runtime permission grant.
@CapacitorPlugin(name = "NetworkRegion")
public class NetworkRegionPlugin extends Plugin {

    @PluginMethod
    public void getNetworkCountry(PluginCall call) {
        JSObject ret = new JSObject();

        TelephonyManager tm = (TelephonyManager) getContext().getSystemService(Context.TELEPHONY_SERVICE);
        if (tm == null) {
            ret.put("networkCountryIso", "");
            ret.put("simCountryIso", "");
            ret.put("isRoaming", false);
            call.resolve(ret);
            return;
        }

        // Country of the network the phone is currently registered to (empty
        // if not registered, e.g. airplane mode or a WiFi-only device).
        String networkCountryIso = safeUpper(tm.getNetworkCountryIso());
        // Country the SIM card itself was issued in (stays fixed while
        // roaming, so it's a good fallback rather than a replacement).
        String simCountryIso = safeUpper(tm.getSimCountryIso());

        boolean isRoaming = false;
        try {
            isRoaming = tm.isNetworkRoaming();
        } catch (SecurityException ignored) {
            // Some OEMs gate this; roaming flag is informational only.
        }

        ret.put("networkCountryIso", networkCountryIso);
        ret.put("simCountryIso", simCountryIso);
        ret.put("isRoaming", isRoaming);
        call.resolve(ret);
    }

    private static String safeUpper(String value) {
        return value == null ? "" : value.toUpperCase();
    }
}
