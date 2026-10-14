plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.trackerduty.staff_app"
    // Platform 37 is published as android-37.0. An integer compileSdk looks up android-37.
    compileSdk = 37
    compileSdkMinor = 0
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.trackerduty.staff_app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = maxOf(flutter.minSdkVersion, 23)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

// Plugins such as permission_handler_android set compileSdk = 37, which resolves
// to android-37. The installed SDK platform is android-37.0.
rootProject.subprojects {
    if (this == project) return@subprojects
    afterEvaluate {
        val library =
            extensions.findByType(com.android.build.api.dsl.LibraryExtension::class.java)
                ?: return@afterEvaluate
        val sdk = library.compileSdk ?: return@afterEvaluate
        if (sdk >= 37 && library.compileSdkMinor == null) {
            library.compileSdkMinor = 0
        }
    }
}
