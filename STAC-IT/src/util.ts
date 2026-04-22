import * as Crypto from "expo-crypto";
import * as AppleAuthentication from "expo-apple-authentication";
import {
    getAuth,
    signInWithCredential,
    AppleAuthProvider,
    FirebaseAuthTypes,
    GoogleAuthProvider,
} from "@react-native-firebase/auth";
import {
    GoogleSignin,
    statusCodes,
    GoogleSigninButton,
    isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import {
    addDoc,
    collection,
    doc,
    getFirestore,
    runTransaction,
    getDoc,
} from "@react-native-firebase/firestore";

async function getNonce(
    size: number = 32,
): Promise<{ raw: string; digest: string }> {
    const raw = await Crypto.getRandomBytesAsync(size).then((buf) =>
        Array.from(buf, (b) => b.toString(16)).join(""),
    );

    return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        raw,
    ).then((digest) => ({ raw, digest }));
}

async function getGoogleToken() {
    try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (response.type === "success") {
            if (!response.data.idToken) {
                throw new Error("Google Sign In: no id token");
            } else {
                return response.data.idToken;
            }
        } else {
            throw new Error("Google Sign-In cancelled");
        }
    } catch (e) {
        throw new Error("Google Sign In failed", { cause: e });
    }
}

export async function doGoogleSignIn() {
    const cred = await getGoogleToken()
        .then((token) => GoogleAuthProvider.credential(token))
        .then((credential) => signInWithCredential(getAuth(), credential));

    if (cred.additionalUserInfo?.isNewUser) {
        console.log("new user");
    }
}

async function getAppleCredential() {
    const { raw, digest } = await getNonce();

    const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: digest,
    });

    if (!credential.identityToken) {
        throw new Error("Apple Sign-In failed: no identity token returned");
    }

    return { credential, raw };
}

export async function registerUserDb(
    uid: string,
    fullName: string,
    email: string,
) {
    const userRef = doc(getFirestore(), "users", uid);

    try {
        await runTransaction(getFirestore(), async (tx) => {
            const userdoc = await tx.get(userRef);

            if (!userdoc.exists()) {
                tx.set(userRef, {
                    fullName,
                    email,
                });
            }
        });
    } catch (e) {
        console.error(e);
    }
}

export async function doAppleSignIn() {
    const { credential: appleCredential, raw } = await getAppleCredential();
    const firebaseCredential = AppleAuthProvider.credential(
        appleCredential.identityToken!,
        raw,
    );

    const { user } = await signInWithCredential(getAuth(), firebaseCredential);

    let { fullName, email } = appleCredential;

    const name = fullName
        ? AppleAuthentication.formatFullName(fullName)
        : (user.displayName ?? "");

    if (!email) {
        email = user.email ?? "";
    }

    registerUserDb(user.uid, name, email);
}
