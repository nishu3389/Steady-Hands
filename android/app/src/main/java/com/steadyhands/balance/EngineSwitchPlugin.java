package com.steadyhands.balance;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "EngineSwitch")
public class EngineSwitchPlugin extends Plugin {

    @PluginMethod
    public void getEngineStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("currentEngine", "webview");
        ret.put("supportsCompose", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void switchToCompose(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), ComposeMainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to launch Compose activity: " + e.getMessage());
        }
    }
}
