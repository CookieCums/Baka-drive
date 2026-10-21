#!/usr/bin/env node
'use strict';

// Adds the Android Keystore bridge needed by the Rust API-hash store to the
// generated Tauri project. Android Gradle/Kotlin sources remain generated and
// ignored by Git; this is executed by CI after "tauri android init".
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const generated = path.join(appRoot, 'src-tauri', 'gen', 'android');
if (!fs.existsSync(generated)) {
  throw new Error('Android project is missing; run "npm run tauri -- android init" first.');
}

function findFiles(directory, basename) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) found.push(...findFiles(full, basename));
    else if (item.isFile() && item.name === basename) found.push(full);
  }
  return found;
}

const candidates = findFiles(path.join(generated, 'app', 'src', 'main', 'java'), 'MainActivity.kt');
if (candidates.length !== 1) throw new Error(`Expected one generated MainActivity.kt; found ${candidates.length}.`);
const activityPath = candidates[0];
let source = fs.readFileSync(activityPath, 'utf8');
const packageName = /^\s*package\s+([A-Za-z0-9_.]+)\s*$/m.exec(source)?.[1];
if (packageName !== 'com.bakadrive.app') {
  throw new Error(`Generated Android package is ${packageName || 'missing'}, expected com.bakadrive.app.`);
}

const marker = 'BAKA_DRIVE_ANDROID_CREDENTIAL_BRIDGE';
const bridge = `
    // ${marker}
    companion object {
        private const val BAKA_CREDENTIAL_PREFS = "baka_drive_credentials_v1"
        private const val BAKA_CREDENTIAL_KEY_ALIAS = "com.bakadrive.app.credentials.v1"
        @Volatile private var bakaApplicationContext: android.content.Context? = null

        private fun bakaCredentialKey(): javax.crypto.SecretKey {
            val store = java.security.KeyStore.getInstance("AndroidKeyStore")
            store.load(null)
            val cached = store.getKey(BAKA_CREDENTIAL_KEY_ALIAS, null)
            if (cached is javax.crypto.SecretKey) return cached
            val generator = javax.crypto.KeyGenerator.getInstance(
                android.security.keystore.KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
            )
            generator.init(
                android.security.keystore.KeyGenParameterSpec.Builder(
                    BAKA_CREDENTIAL_KEY_ALIAS,
                    android.security.keystore.KeyProperties.PURPOSE_ENCRYPT or
                        android.security.keystore.KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setRandomizedEncryptionRequired(true)
                    .build()
            )
            return generator.generateKey()
        }

        private fun bakaPreferences(): android.content.SharedPreferences {
            val context = bakaApplicationContext
                ?: throw IllegalStateException("Android credential storage is not initialized")
            return context.getSharedPreferences(BAKA_CREDENTIAL_PREFS, android.content.Context.MODE_PRIVATE)
        }

        @JvmStatic fun getCredential(account: String): String? {
            return try {
                val record = bakaPreferences().getString(account, null) ?: return null
                val packed = android.util.Base64.decode(record, android.util.Base64.NO_WRAP)
                if (packed.size <= 12) return null
                val iv = packed.copyOfRange(0, 12)
                val encrypted = packed.copyOfRange(12, packed.size)
                val cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding")
                cipher.init(
                    javax.crypto.Cipher.DECRYPT_MODE,
                    bakaCredentialKey(),
                    javax.crypto.spec.GCMParameterSpec(128, iv)
                )
                cipher.updateAAD(account.toByteArray(Charsets.UTF_8))
                String(cipher.doFinal(encrypted), Charsets.UTF_8)
            } catch (_: Exception) {
                null
            }
        }

        @JvmStatic fun putCredential(account: String, value: String): Boolean {
            return try {
                val cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding")
                cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, bakaCredentialKey())
                cipher.updateAAD(account.toByteArray(Charsets.UTF_8))
                val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
                val packed = cipher.iv + encrypted
                bakaPreferences().edit()
                    .putString(account, android.util.Base64.encodeToString(packed, android.util.Base64.NO_WRAP))
                    .commit()
            } catch (_: Exception) {
                false
            }
        }

        @JvmStatic fun deleteCredential(account: String): Boolean {
            return try {
                bakaPreferences().edit().remove(account).commit()
            } catch (_: Exception) {
                false
            }
        }
    }
`;

if (!source.includes(marker)) {
  // The generated Tauri MainActivity is intentionally small. Add a class body
  // if the template used a body-less Kotlin class declaration.
  const classStart = source.indexOf('class MainActivity');
  if (classStart < 0) throw new Error('Generated MainActivity class declaration was not found.');
  let opening = source.indexOf('{', classStart);
  if (opening < 0) {
    const lineEnd = source.indexOf('\n', classStart);
    if (lineEnd < 0) throw new Error('Malformed MainActivity.kt.');
    source = source.slice(0, lineEnd) + ' {\n' + source.slice(lineEnd + 1);
    opening = source.indexOf('{', classStart);
  }
  const close = source.lastIndexOf('}');
  if (opening < 0 || close <= opening) throw new Error('Could not locate the MainActivity class body.');
  const onCreate = `
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        bakaApplicationContext = applicationContext
        super.onCreate(savedInstanceState)
    }
`;
  source = source.slice(0, close) + onCreate + bridge + '\n' + source.slice(close);
  fs.writeFileSync(activityPath, source);
}

// JNI resolves these methods by name at runtime. Retain them if this generated
// project is later used for an R8/minified build; current CI artifacts are debug.
const proguardPath = path.join(generated, 'app', 'proguard-rules.pro');
const proguard = fs.existsSync(proguardPath) ? fs.readFileSync(proguardPath, 'utf8') : '';
const keep = `
# Baka Drive calls these native credential methods through JNI.
-keep class com.bakadrive.app.MainActivity {
    public static java.lang.String getCredential(java.lang.String);
    public static boolean putCredential(java.lang.String, java.lang.String);
    public static boolean deleteCredential(java.lang.String);
}
`;
if (!proguard.includes('getCredential(java.lang.String)')) fs.writeFileSync(proguardPath, proguard + keep);

for (const file of findFiles(path.join(generated, 'app', 'src', 'main', 'res'), 'strings.xml')) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/(<string\s+name="app_name"[^>]*>)[\s\S]*?(<\/string>)/, '$1Baka Drive$2');
  if (before !== after) fs.writeFileSync(file, after);
}

const manifestPath = path.join(generated, 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) throw new Error('Generated AndroidManifest.xml is missing.');
const manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('com.bakadrive.app')) throw new Error('Generated Android manifest has the wrong application identity.');
const gradleFiles = findFiles(path.join(generated, 'app'), 'build.gradle');
const gradleKtsFiles = findFiles(path.join(generated, 'app'), 'build.gradle.kts');
const gradle = [...gradleFiles, ...gradleKtsFiles].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const minSdk = /minSdk(?:Version)?\s*(?:=\s*)?(\d+)/.exec(gradle)?.[1];
if (!minSdk || Number(minSdk) < 24) throw new Error(`Android minSdk must be >=24; observed ${minSdk || 'missing'}.`);

console.log(`Prepared Android Keystore credential bridge in ${path.relative(appRoot, activityPath)}; minSdk=${minSdk}.`);
