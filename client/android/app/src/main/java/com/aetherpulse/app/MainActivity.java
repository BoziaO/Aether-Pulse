package com.aetherpulse.app;

import android.app.PictureInPictureParams;
import android.os.Build;
import android.util.Rational;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onUserLeaveHint() {
    super.onUserLeaveHint();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !isInPictureInPictureMode() && isRoomOpen()) {
      PictureInPictureParams params = new PictureInPictureParams.Builder()
        .setAspectRatio(new Rational(16, 9))
        .build();
      enterPictureInPictureMode(params);
    }
  }

  private boolean isRoomOpen() {
    if (getBridge() == null || getBridge().getWebView() == null) return false;
    String url = getBridge().getWebView().getUrl();
    return url != null && url.contains("/app/room/");
  }
}
