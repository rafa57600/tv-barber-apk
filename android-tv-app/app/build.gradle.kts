import java.util.Properties

plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

fun String.toBuildConfigString(): String =
  "\"${replace("\\", "\\\\").replace("\"", "\\\"")}\""

val localProps = Properties().apply {
  val localPropsFile = rootProject.file("local.properties")
  if (localPropsFile.exists()) {
    localPropsFile.inputStream().use { load(it) }
  }
}

fun readConfig(name: String, defaultValue: String = ""): String {
  return providers.gradleProperty(name).orNull
    ?: providers.environmentVariable(name).orNull
    ?: localProps.getProperty(name)
    ?: defaultValue
}

val tvBaseUrl: String =
  readConfig("TV_BASE_URL", "https://barbershoprdv.fsp57.com/tv/setup")

val spotifyClientId: String =
  readConfig("SPOTIFY_CLIENT_ID", "")

val tvReleaseStoreFile: String =
  readConfig("TV_RELEASE_STORE_FILE")

val tvReleaseStorePassword: String =
  readConfig("TV_RELEASE_STORE_PASSWORD")

val tvReleaseKeyAlias: String =
  readConfig("TV_RELEASE_KEY_ALIAS")

val tvReleaseKeyPassword: String =
  readConfig("TV_RELEASE_KEY_PASSWORD")

val hasReleaseSigning =
  tvReleaseStoreFile.isNotBlank() &&
    tvReleaseStorePassword.isNotBlank() &&
    tvReleaseKeyAlias.isNotBlank() &&
    tvReleaseKeyPassword.isNotBlank()

android {
  namespace = "com.barbershop.tv"
  compileSdk = 35

  signingConfigs {
    if (hasReleaseSigning) {
      create("release") {
        storeFile = file(tvReleaseStoreFile)
        storePassword = tvReleaseStorePassword
        keyAlias = tvReleaseKeyAlias
        keyPassword = tvReleaseKeyPassword
      }
    }
  }

  defaultConfig {
    applicationId = "com.barbershop.tv"
    minSdk = 24
    targetSdk = 35
    versionCode = 4
    versionName = "1.1.1"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

    buildConfigField("String", "TV_BASE_URL", tvBaseUrl.toBuildConfigString())
    buildConfigField("String", "SPOTIFY_CLIENT_ID", spotifyClientId.toBuildConfigString())
  }

  buildTypes {
    debug {
      isMinifyEnabled = false
    }

    release {
      if (hasReleaseSigning) {
        signingConfig = signingConfigs.getByName("release")
      } else {
        signingConfig = signingConfigs.getByName("debug")
        logger.warn("TV release signing is not configured. Release APK will be signed with debug key.")
      }

      isMinifyEnabled = true
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }

  buildFeatures {
    buildConfig = true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation(files("libs/spotify-app-remote-release-0.8.0.aar"))
  implementation("com.google.code.gson:gson:2.10.1")
}
