package com.steadyhands.balance;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.Priority;

// Gates round-start on real GPS readiness for PlayScreen: requests fine/coarse
// location permission, then asks Google Play Services whether the device's
// current location setting actually satisfies high-accuracy tracking. If not,
// it shows Android's native one-tap "Turn on GPS" resolution dialog rather
// than just linking out to the Settings app.
@CapacitorPlugin(
    name = "LocationResolver",
    requestCodes = { LocationResolverPlugin.REQUEST_CHECK_SETTINGS },
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
            alias = "location"
        )
    }
)
public class LocationResolverPlugin extends Plugin {

    static final int REQUEST_CHECK_SETTINGS = 9001;

    @PluginMethod
    public void ensureLocationReady(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            checkLocationSettings(call);
        } else {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
        }
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            checkLocationSettings(call);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            ret.put("gpsEnabled", false);
            call.resolve(ret);
        }
    }

    private void checkLocationSettings(PluginCall call) {
        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000).build();
        LocationSettingsRequest settingsRequest = new LocationSettingsRequest.Builder()
            .addLocationRequest(locationRequest)
            .build();

        LocationServices.getSettingsClient(getActivity())
            .checkLocationSettings(settingsRequest)
            .addOnSuccessListener(getActivity(), response -> {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                ret.put("gpsEnabled", true);
                call.resolve(ret);
            })
            .addOnFailureListener(getActivity(), e -> {
                if (e instanceof ResolvableApiException) {
                    try {
                        saveCall(call);
                        ((ResolvableApiException) e).startResolutionForResult(getActivity(), REQUEST_CHECK_SETTINGS);
                    } catch (IntentSender.SendIntentException sendEx) {
                        JSObject ret = new JSObject();
                        ret.put("granted", true);
                        ret.put("gpsEnabled", false);
                        call.resolve(ret);
                    }
                } else {
                    // No resolution possible (e.g. settings change unavailable on this device).
                    JSObject ret = new JSObject();
                    ret.put("granted", true);
                    ret.put("gpsEnabled", false);
                    call.resolve(ret);
                }
            });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_CHECK_SETTINGS) {
            return;
        }
        PluginCall call = getSavedCall();
        if (call == null) {
            return;
        }
        JSObject ret = new JSObject();
        ret.put("granted", true);
        ret.put("gpsEnabled", resultCode == Activity.RESULT_OK);
        call.resolve(ret);
        freeSavedCall();
    }
}
