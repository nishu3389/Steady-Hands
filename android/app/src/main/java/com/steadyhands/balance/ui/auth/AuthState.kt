package com.steadyhands.balance.ui.auth

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.google.android.gms.tasks.Task
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.steadyhands.balance.R
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

data class UserProfile(
    val isSignedIn: Boolean,
    val name: String,
    val email: String?,
    val avatarUrl: String?,
    val uid: String?
) {
    companion object {
        fun guest() = UserProfile(
            isSignedIn = false,
            name = "Guest Player",
            email = null,
            avatarUrl = null,
            uid = null
        )
    }
}

/**
 * Mirrors the web app's Firebase-backed Google Sign-In (src/services/googleAuth.ts):
 * same Firebase project, same UserProfile shape, same guest fallback.
 */
object AuthState {
    var profile by mutableStateOf(UserProfile.guest())
        private set

    private var initialized = false

    fun init(context: Context) {
        if (initialized) return
        initialized = true
        ensureFirebaseApp(context)
        profile = FirebaseAuth.getInstance().currentUser?.toProfile() ?: UserProfile.guest()
    }

    private fun ensureFirebaseApp(context: Context) {
        if (FirebaseApp.getApps(context).isNotEmpty()) return
        // Same project identity as src/services/firebase.ts on the web side —
        // there's no google-services.json checked in, so build FirebaseOptions
        // by hand instead of relying on the google-services Gradle plugin.
        val options = FirebaseOptions.Builder()
            .setApiKey("AIzaSyAyF3TwVo-o2kNj1j7TfooaYdVtF54V6XE")
            .setApplicationId("1:235232628807:android:53069bab611971ba1e6162")
            .setProjectId("steadyhands-5cf12")
            .setStorageBucket("steadyhands-5cf12.firebasestorage.app")
            .setGcmSenderId("235232628807")
            .build()
        FirebaseApp.initializeApp(context, options)
    }

    suspend fun signIn(context: Context) {
        val webClientId = context.getString(R.string.google_sign_in_web_client_id)
        val credentialManager = CredentialManager.create(context)
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(GetSignInWithGoogleOption.Builder(webClientId).build())
            .build()

        val result = credentialManager.getCredential(context, request)
        val credential = result.credential
        check(credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            "Unexpected credential type returned from Credential Manager: ${credential.type}"
        }

        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
        val firebaseCredential = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
        val authResult = FirebaseAuth.getInstance().signInWithCredential(firebaseCredential).await()
        profile = authResult.user?.toProfile() ?: UserProfile.guest()
    }

    suspend fun signOut(context: Context) {
        FirebaseAuth.getInstance().signOut()
        runCatching {
            CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
        }
        profile = UserProfile.guest()
    }

    private fun FirebaseUser.toProfile() = UserProfile(
        isSignedIn = true,
        name = displayName ?: "Player",
        email = email,
        avatarUrl = photoUrl?.toString(),
        uid = uid
    )

    private suspend fun <T> Task<T>.await(): T = suspendCancellableCoroutine { cont ->
        addOnCompleteListener { task ->
            if (task.isSuccessful) {
                cont.resume(task.result)
            } else {
                cont.resumeWithException(task.exception ?: IllegalStateException("Task failed"))
            }
        }
    }
}
