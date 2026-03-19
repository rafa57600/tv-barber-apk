package com.barbershop.tv

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import com.google.gson.Gson

class MainActivity : AppCompatActivity() {
  companion object {
    private const val TAG = "BarberShopTV"
  }

  private lateinit var webView: WebView
  private lateinit var splashOverlay: View
  private lateinit var statusOverlay: TextView

  private val retryHandler = Handler(Looper.getMainLooper())
  private val retryRunnable = Runnable { loadDisplay() }
  private val appStartedAt = System.currentTimeMillis()
  private var splashDismissed = false

  private var spotifyAppRemote: SpotifyAppRemote? = null
  private var spotifyConnecting = false
  private val gson = Gson()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    webView = findViewById(R.id.tvWebView)
    splashOverlay = findViewById(R.id.splashOverlay)
    statusOverlay = findViewById(R.id.statusOverlay)

    setImmersiveMode()
    configureWebView()
    loadDisplay()
  }

  override fun onStart() {
    super.onStart()
    connectToSpotify()
  }

  override fun onStop() {
    super.onStop()
    disconnectFromSpotify()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) setImmersiveMode()
  }

  override fun onDestroy() {
    retryHandler.removeCallbacks(retryRunnable)
    webView.stopLoading()
    webView.destroy()
    super.onDestroy()
  }

  private fun connectToSpotify() {
    if (BuildConfig.SPOTIFY_CLIENT_ID.isEmpty()) {
      Log.e(TAG, "Spotify Client ID is not configured")
      return
    }
    if (spotifyConnecting || spotifyAppRemote?.isConnected == true) return
    spotifyConnecting = true

    val connectionParams = ConnectionParams.Builder(BuildConfig.SPOTIFY_CLIENT_ID)
      .setRedirectUri("barbershoptv://callback")
      .showAuthView(true)
      .build()

    SpotifyAppRemote.connect(this, connectionParams, object : Connector.ConnectionListener {
      override fun onConnected(appRemote: SpotifyAppRemote) {
        spotifyConnecting = false
        spotifyAppRemote = appRemote
        Log.d(TAG, "Connected to Spotify")
        subscribeToSpotifyState()
        // Notify WebView that Spotify is connected
        notifyWebview("onSpotifyConnected", true)
      }

      override fun onFailure(throwable: Throwable) {
        spotifyConnecting = false
        Log.e(TAG, "Spotify connection failed", throwable)
        spotifyAppRemote = null
        notifyWebview("onSpotifyConnected", false)
        // Retry after 10 seconds
        retryHandler.postDelayed({ connectToSpotify() }, 10_000)
      }
    })
  }

  private fun disconnectFromSpotify() {
    spotifyAppRemote?.let {
      SpotifyAppRemote.disconnect(it)
    }
    spotifyAppRemote = null
  }

  private fun subscribeToSpotifyState() {
    spotifyAppRemote?.playerApi?.subscribeToPlayerState()?.setEventCallback { playerState ->
      val stateMap = mutableMapOf<String, Any?>()
      stateMap["paused"] = playerState.isPaused
      stateMap["track"] = mapOf(
        "name" to playerState.track?.name,
        "artist" to playerState.track?.artist?.name,
        "uri" to playerState.track?.uri,
        "duration" to playerState.track?.duration,
        "albumName" to (playerState.track?.album?.name ?: ""),
        "albumArtUrl" to (playerState.track?.let { track ->
          val raw = track.imageUri?.raw ?: ""
          if (raw.startsWith("spotify:image:")) {
            "https://i.scdn.co/image/${raw.removePrefix("spotify:image:")}"
          } else ""
        } ?: "")
      )
      stateMap["position"] = playerState.playbackPosition
      
      val json = gson.toJson(stateMap)
      notifyWebview("onSpotifyPlaybackState", json)
    }
  }

  private fun notifyWebview(event: String, data: Any) {
    val jsData = when (data) {
      is String -> data  // Already JSON-encoded string — inject raw
      is Boolean -> if (data) "true" else "false"
      else -> data.toString()
    }
    val script = "if(window.onAndroidSpotifyEvent) window.onAndroidSpotifyEvent('$event', $jsData);"
    runOnUiThread {
      webView.evaluateJavascript(script, null)
    }
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (event.action != KeyEvent.ACTION_DOWN) {
      return super.dispatchKeyEvent(event)
    }

    when (event.keyCode) {
      KeyEvent.KEYCODE_DPAD_CENTER,
      KeyEvent.KEYCODE_ENTER,
      KeyEvent.KEYCODE_NUMPAD_ENTER -> {
        dispatchRemoteKey("Enter")
        return true
      }

      KeyEvent.KEYCODE_DPAD_UP -> {
        dispatchRemoteKey("ArrowUp")
        return true
      }

      KeyEvent.KEYCODE_DPAD_DOWN -> {
        dispatchRemoteKey("ArrowDown")
        return true
      }

      KeyEvent.KEYCODE_DPAD_LEFT -> {
        dispatchRemoteKey("ArrowLeft")
        return true
      }

      KeyEvent.KEYCODE_DPAD_RIGHT -> {
        dispatchRemoteKey("ArrowRight")
        return true
      }

      KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
        toggleSpotifyPlayback()
        dispatchRemoteKey("MediaPlayPause")
        return true
      }

      KeyEvent.KEYCODE_MEDIA_PLAY -> {
        spotifyAppRemote?.playerApi?.resume()
        dispatchRemoteKey("MediaPlay")
        return true
      }

      KeyEvent.KEYCODE_MEDIA_PAUSE -> {
        spotifyAppRemote?.playerApi?.pause()
        dispatchRemoteKey("MediaPause")
        return true
      }

      KeyEvent.KEYCODE_MEDIA_NEXT -> {
        spotifyAppRemote?.playerApi?.skipNext()
        dispatchRemoteKey("MediaTrackNext")
        return true
      }

      KeyEvent.KEYCODE_MEDIA_PREVIOUS,
      KeyEvent.KEYCODE_MEDIA_REWIND -> {
        spotifyAppRemote?.playerApi?.skipPrevious()
        dispatchRemoteKey("MediaTrackPrevious")
        return true
      }

      KeyEvent.KEYCODE_VOLUME_MUTE -> {
        dispatchRemoteKey("AudioVolumeMute")
        return true
      }

      KeyEvent.KEYCODE_BACK -> {
        dispatchRemoteKey("Escape")
        return true
      }
    }

    return super.dispatchKeyEvent(event)
  }

  private fun toggleSpotifyPlayback() {
    spotifyAppRemote?.playerApi?.playerState?.setResultCallback { playerState ->
      if (playerState.isPaused) {
        spotifyAppRemote?.playerApi?.resume()
      } else {
        spotifyAppRemote?.playerApi?.pause()
      }
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun configureWebView() {
    if (BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(true)
    }

    val cookieManager = CookieManager.getInstance()
    cookieManager.setAcceptCookie(true)
    cookieManager.setAcceptThirdPartyCookies(webView, true)

    webView.settings.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
      javaScriptCanOpenWindowsAutomatically = true
      mediaPlaybackRequiresUserGesture = false
      cacheMode = WebSettings.LOAD_DEFAULT
      mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
      loadWithOverviewMode = true
      useWideViewPort = true
      textZoom = 100
      setSupportZoom(false)
      displayZoomControls = false
      builtInZoomControls = false
      val currentUa = userAgentString
      userAgentString = buildDesktopUserAgent(currentUa)
    }

    // Keep WebView interactive for mouse / air-mouse remotes
    webView.isFocusable = true
    webView.isFocusableInTouchMode = true
    webView.requestFocus()
    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

    // Add JavaScript Bridge
    webView.addJavascriptInterface(SpotifyBridge(), "SpotifyBridge")

    webView.webChromeClient = object : WebChromeClient() {
      override fun onProgressChanged(view: WebView?, newProgress: Int) {
        if (newProgress >= 90) {
          statusOverlay.visibility = View.GONE
        }
      }
    }

    webView.webViewClient = object : WebViewClient() {
      override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        statusOverlay.text = getString(R.string.status_loading)
        statusOverlay.visibility = View.VISIBLE
        if (!splashDismissed) {
          splashOverlay.alpha = 1f
          splashOverlay.visibility = View.VISIBLE
        }
      }

      override fun onPageFinished(view: WebView?, url: String?) {
        dismissSplash()
        retryHandler.removeCallbacks(retryRunnable)
      }

      override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
      ) {
        if (request?.isForMainFrame == true) {
          showRetryState()
        }
      }
    }
  }

  private fun loadDisplay() {
    val url = buildDisplayUrl()
    Log.i(TAG, "Loading TV page")
    webView.loadUrl(url)
  }

  private fun buildDisplayUrl(): String {
    return BuildConfig.TV_BASE_URL
  }

  private fun buildDesktopUserAgent(currentUa: String): String {
    val chromeVersion = Regex("Chrome/([\\d.]+)")
      .find(currentUa)
      ?.value
      ?: "Chrome/133.0.0.0"

    return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) $chromeVersion Safari/537.36 BarberShopTV/1.2"
  }

  private fun showRetryState() {
    statusOverlay.text = getString(R.string.status_retrying)
    statusOverlay.visibility = View.VISIBLE
    splashOverlay.alpha = 1f
    splashOverlay.visibility = View.VISIBLE
    splashDismissed = false
    retryHandler.removeCallbacks(retryRunnable)
    retryHandler.postDelayed(retryRunnable, 7000)
  }

  private fun dismissSplash() {
    if (splashDismissed) {
      statusOverlay.visibility = View.GONE
      return
    }

    splashDismissed = true
    val elapsed = System.currentTimeMillis() - appStartedAt
    val minSplashDuration = 1800L
    val delay = (minSplashDuration - elapsed).coerceAtLeast(0L)

    retryHandler.postDelayed({
      splashOverlay.animate()
        .alpha(0f)
        .setDuration(450)
        .withEndAction {
          splashOverlay.visibility = View.GONE
          statusOverlay.visibility = View.GONE
        }
        .start()
    }, delay)
  }

  private fun dispatchRemoteKey(key: String) {
    val script = "window.dispatchEvent(new KeyboardEvent('keydown',{key:'$key',code:'$key',bubbles:true}));"
    webView.evaluateJavascript(script, null)
  }

  private fun setImmersiveMode() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.hide(
        android.view.WindowInsets.Type.statusBars() or android.view.WindowInsets.Type.navigationBars()
      )
      window.insetsController?.systemBarsBehavior =
        android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = (
        View.SYSTEM_UI_FLAG_FULLSCREEN
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      )
    }
  }

  /**
   * JavaScript Interface for Spotify Control
   */
  inner class SpotifyBridge {
    @JavascriptInterface
    fun play(uri: String) {
      Log.d(TAG, "Bridge: play $uri")
      spotifyAppRemote?.playerApi?.play(uri)
    }

    @JavascriptInterface
    fun pause() {
      Log.d(TAG, "Bridge: pause")
      spotifyAppRemote?.playerApi?.pause()
    }

    @JavascriptInterface
    fun resume() {
      Log.d(TAG, "Bridge: resume")
      spotifyAppRemote?.playerApi?.resume()
    }

    @JavascriptInterface
    fun skipNext() {
      Log.d(TAG, "Bridge: skipNext")
      spotifyAppRemote?.playerApi?.skipNext()
    }

    @JavascriptInterface
    fun skipPrevious() {
      Log.d(TAG, "Bridge: skipPrevious")
      spotifyAppRemote?.playerApi?.skipPrevious()
    }

    @JavascriptInterface
    fun seekForward(ms: Int) {
      Log.d(TAG, "Bridge: seekForward $ms")
      spotifyAppRemote?.playerApi?.seekToRelativePosition(ms.toLong())
    }

    @JavascriptInterface
    fun isConnected(): Boolean {
      return spotifyAppRemote?.isConnected ?: false
    }
  }
}
