package io.snapplay.s2offerwall_rn;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import s2.adapi.sdk.offerwall.S2Offerwall;

public class S2OfferwallModule extends ReactContextBaseJavaModule {
    private static final String TAG = "S2OfferwallModule";

    public S2OfferwallModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        //registerOfferwallListener();
    }

    @NonNull
    @Override
    public String getName() {
        return "S2OfferwallModule";
    }

    // 이벤트 전송
    private void sendEvent(String eventName, WritableMap params) {
        if (getReactApplicationContext().hasActiveCatalystInstance()) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    private void registerOfferwallListener() {
        S2Offerwall.setEventListener(new S2Offerwall.EventListener() {
            @Override
            public void onLoginRequested(String param) {
                WritableMap map = Arguments.createMap();
                map.putString("name", "onLoginRequested");
                map.putString("param", param);
                sendEvent("onLoginRequested", map);
            }

            @Override
            public void onCloseRequested(String param) {
                // 필요시 구현
            }

            @Override
            public void onPermissionRequested(String permission) {
                // 필요시 구현
            }
        });
    }

    @ReactMethod
    public void initSdk(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is not attached");
            return;
        }

        registerOfferwallListener();

        S2Offerwall.initSdk(activity, new S2Offerwall.InitializeListener() {
            @Override
            public void onSuccess() {
                WritableMap map = Arguments.createMap();
                map.putString("name", "onInitCompleted");
                map.putBoolean("flag", true);
                sendEvent("onInitCompleted", map);
                promise.resolve(null);
            }

            @Override
            public void onFailure() {
                WritableMap map = Arguments.createMap();
                map.putString("name", "onInitCompleted");
                map.putBoolean("flag", false);
                sendEvent("onInitCompleted", map);
                promise.resolve(null);
            }
        });
    }

    @ReactMethod
    public void showOfferwall(String placementName, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is not attached");
            return;
        }
        activity.runOnUiThread(() -> {
            S2Offerwall.startActivity(activity, placementName);
            promise.resolve(null);
        });
    }

    @ReactMethod
    public void setAppId(String appId, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            S2Offerwall.setAppId(activity, appId);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void setAppIdForAndroid(String appId, Promise promise) {
        setAppId(appId, promise);
    }

    @ReactMethod
    public void setAppIdForIOS(String appId, Promise promise) {
        // Android에서는 실행 안 함
        promise.resolve(null);
    }

    @ReactMethod
    public void setUserName(String userName, String displayName, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            S2Offerwall.setUserName(activity, userName, displayName);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void getUserName(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            String userName = S2Offerwall.getUserName(activity);
            promise.resolve(userName);
        } else {
            promise.resolve("");
        }
    }

    @ReactMethod
    public void resetUserName(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            S2Offerwall.resetUserName(activity);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void presentATTPopup(Promise promise) {
        // Android에서는 구현 없을 경우
        promise.resolve(null);
    }

    @ReactMethod
    public void setConsentDialogRequired(boolean required, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            S2Offerwall.setConsentDialogRequired(activity, required);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void setConsentAgreed(boolean agreed, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            S2Offerwall.setConsentAgreed(activity, agreed);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void requestOfferwallData(String placementName, boolean isEmbeded, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is not attached");
            return;
        }

        new Thread(() -> {
            String data = S2Offerwall.requestOfferwallData(activity, placementName, isEmbeded);
            promise.resolve(data);
        }).start();
    }

    @ReactMethod
    public void openAdItem(double advId, boolean needDetail, String placementFrom, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                S2Offerwall.openAdItem(activity, (long) advId, needDetail, placementFrom);
            });
            promise.resolve(null);
        } 
        else {
            promise.reject("NO_ACTIVITY", "Activity is not attached");
        }
    }

    @ReactMethod
    public void closeTop(Promise promise) {
        S2Offerwall.closeTop();
        promise.resolve(null);
    }

    @ReactMethod
    public void closeAll(Promise promise) {
        S2Offerwall.closeAll();
        promise.resolve(null);
    }

    @ReactMethod
    public void getPlatformVersion(Promise promise) {
        promise.resolve("Android " + android.os.Build.VERSION.RELEASE);
    }
}
