# Local Development

VeloLog uses an Expo development build rather than Expo Go. Native features such as background
location, localization, notifications, SQLite, and MapLibre require the native modules included
in that build.

## Normal Android emulator startup

Prerequisites:

- Android Studio is installed and an Android emulator is running.
- Dependencies have been installed with `npm install`.
- The VeloLog **development** build is installed on the emulator. A `preview` build is a
  standalone test build and cannot connect to Metro for live coding.

From the repository root, start Metro:

```powershell
npm start -- --dev-client --host lan
```

Keep that terminal open. Then open VeloLog on the emulator. If it does not connect
automatically, connect port 8081 and launch it explicitly:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb reverse tcp:8081 tcp:8081
& $adb shell am start -a android.intent.action.VIEW -d "velolog://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
```

Metro should report an Android bundle, after which saved JavaScript and TypeScript changes
reload in the emulator.

## Installing or rebuilding the development client

Create an EAS development APK when the installed client is absent or when native dependencies
or Expo configuration change:

```powershell
npx eas-cli build --platform android --profile development
```

Open the resulting EAS build page and install its APK on the emulator. Alternatively, download
the APK and install it with:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install path\to\build.apk
```

If Android reports `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the installed app was signed by a
different certificate. Uninstall the existing VeloLog app first, understanding that this clears
its emulator-local data, and then install the new APK.

## Local native Android builds

EAS builds do not require a local Java installation. Commands such as `npm run android` and
`android\gradlew.bat`, however, require `JAVA_HOME`.

Android Studio's bundled JDK is normally:

```text
C:\Program Files\Android\Android Studio\jbr
```

For the current PowerShell session:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
npm run android
```

Confirm Java is available with:

```powershell
java -version
```

## Troubleshooting

### Blank screen or native module not found

Errors such as `Cannot find native module 'ExpoLocalization'` mean the installed binary is stale
or is not the development build. Install a fresh EAS build made with the `development` profile;
restarting Metro alone cannot add native modules.

### Development client cannot load the project

1. Confirm Metro is still running and says `Waiting on http://localhost:8081`.
2. Use `--host lan`, not `--localhost`. On Windows, `--localhost` can bind only to IPv6 while
   the emulator attempts an IPv4 connection.
3. Run `adb reverse tcp:8081 tcp:8081` again.
4. Relaunch using the explicit `velolog://expo-development-client` command above.

Check the listening address if needed:

```powershell
netstat -ano | Select-String ":8081"
```

The healthy Windows result includes `0.0.0.0:8081` or `[::]:8081`. A listener only on
`[::1]:8081` can cause an `unexpected end of stream` error in the emulator.

### Metro port is already occupied

Find the process:

```powershell
netstat -ano | Select-String ":8081"
```

Close the old Metro terminal or stop only the identified process, then start Metro again.

