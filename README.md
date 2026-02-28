# AlarmFLow

This is a guide that explains how to set up a React Native development environment using Android Studio

---

## Install Node.js

### Windows
You'll want to install the **LTS version**, using **Chocolatey**

Install Chocolatey in administrative mode with powershell using the following command:
```
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```
And then follow the instructions for your system to install [Node.js](https://nodejs.org)

Verify installation with:
```
node -v
npm -v
```

## Install Java JDK 17

Install [JDK17](https://adoptium.net/temurin/releases?version=17&os=any&arch=any). 

Verify installation with: 
```
java -version
```

## Install Android Studio

Install [Android Studios: Otter 3](https://developer.android.com/studio/archive)

Install with default options, and make sure the following components are installed:
* Android SDK
* SDK Platform Tools
* SDK Build Tools
* Android Emulator
* Virtual Device Manager

## Install Android 16 SDK

Open Android Studio and click More Actions -> SDK Manager

Under SDK Platforms, select: **Android 16 ("Baklava")**

Under SDK Tools, ensure the following are installed:
* Android SDK Build Tools
* Android Emulator
* Android SDK Platform Tools

## Configure Environment Variables
### Windows
Using the serach bar, open **Edit System Environment Variables**

Create new variable system variable
```
Variable Name: ANDROID_HOME
Variable Value: C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```
Edit the PATH variable, and add ***2*** new paths
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```
Then restart your computer

## Create a React Native Project

In Command Prompt or PowerShell:
```
npx @react-native-community/cli init AppName
```
Enter project folder

## Create Android Emulator

Click: More Actions -> Virtual Device Manager -> Create Device

Select: Pixel 8

Click: Next -> Android 16 ("Buklava") -> Finish

Start Emulator

To make sure the app is running, run the following command to open Metro:
```
npx react-native start
```
In another terminal run:
```
npx react-native run-android
```
And the app should launch!
