package mx.pulso.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.ContextCompat

/**
 * Launcher y puente del widget.
 * - Icono de app → /inicio
 * - Widget / ACTION_OPEN_HELP → /ayuda?from=widget
 */
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        openPulso(intent)
        finish()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        openPulso(intent)
        finish()
    }

    private fun openPulso(intent: Intent?) {
        val path = when (intent?.action) {
            ACTION_OPEN_HELP -> "/ayuda?from=widget"
            else -> "/inicio"
        }
        val url = BuildConfig.PULSO_BASE_URL.trimEnd('/') + path
        val uri = Uri.parse(url)

        val color = ContextCompat.getColor(this, R.color.pulso_primary)
        val colorParams = CustomTabColorSchemeParams.Builder()
            .setToolbarColor(color)
            .build()

        val customTabs = CustomTabsIntent.Builder()
            .setDefaultColorSchemeParams(colorParams)
            .setShowTitle(true)
            .setUrlBarHidingEnabled(false)
            .build()

        try {
            customTabs.launchUrl(this, uri)
        } catch (_: Exception) {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        }
    }

    companion object {
        const val ACTION_OPEN_HELP = "mx.pulso.app.action.OPEN_HELP"
    }
}
