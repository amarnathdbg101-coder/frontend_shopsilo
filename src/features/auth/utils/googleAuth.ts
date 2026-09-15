import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  idToken: string;
  email?: string;
  name?: string;
  photo?: string;
}

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "328255141048-v4r4fga1oas928b5imvh9jpbaemrc9a8.apps.googleusercontent.com";

/**
 * Production Google Sign In Helper for Shopsilo App
 * Supports both Native Google Sign-In and Universal Web OAuth2 Flow via shopsilo.in bridge.
 */
export const promptGoogleSignIn = async (): Promise<GoogleAuthResult> => {
  // 1. First Attempt: Native @react-native-google-signin if available in dev build
  try {
    const { GoogleSignin } = require("@react-native-google-signin/google-signin");
    if (GoogleSignin && typeof GoogleSignin.configure === "function") {
      GoogleSignin.configure({
        webClientId: GOOGLE_CLIENT_ID,
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (response.data?.idToken) {
        return {
          idToken: response.data.idToken,
          email: response.data.user?.email,
          name: response.data.user?.name || undefined,
          photo: response.data.user?.photo || undefined,
        };
      }
    }
  } catch (nativeErr: any) {
    if (nativeErr?.code === "SIGN_IN_CANCELLED") {
      throw new Error("Google sign in was cancelled");
    }
    console.log("[GoogleAuth] Native Sign-In unavailable, using shopsilo.in OAuth bridge:", nativeErr?.message);
  }

  // 2. Second Attempt: Universal OAuth2 Flow via verified domain bridge (https://shopsilo.in/auth/callback)
  try {
    const webRedirectUri = "https://shopsilo.in/auth/callback";
    const appReturnUrl = "shopsilo://auth/callback";

    const nonce = Math.random().toString(36).substring(2, 15);
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&response_type=id_token` +
      `&scope=${encodeURIComponent("openid profile email")}` +
      `&redirect_uri=${encodeURIComponent(webRedirectUri)}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    const authResult = await WebBrowser.openAuthSessionAsync(authUrl, appReturnUrl);

    if (authResult.type === "success" && authResult.url) {
      // Extract id_token from response hash or query string
      const urlPart = authResult.url.includes("#")
        ? authResult.url.split("#")[1]
        : authResult.url.split("?")[1];

      const params = new URLSearchParams(urlPart);
      const idToken = params.get("id_token");

      if (idToken) {
        return { idToken };
      }
    }

    if (authResult.type === "cancel" || authResult.type === "dismiss") {
      throw new Error("Google sign in was cancelled");
    }

    throw new Error("Could not retrieve Google authentication token. Please try again.");
  } catch (err: any) {
    console.error("[GoogleAuth] Google Sign-In failed:", err);
    throw err;
  }
};
