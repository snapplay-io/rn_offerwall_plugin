package com.s2offerwall

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = S2offerwallModule.NAME)
class S2offerwallModule(reactContext: ReactApplicationContext) :
  NativeS2offerwallSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = "S2offerwall"
  }
}
