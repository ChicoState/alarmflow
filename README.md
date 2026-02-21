# AlarmFLow

This is a guide that explains how to set up a React Native development environment using Android Studio

---

## Install Node.js

You'll want to install the **LTS version**, using Chocolatey:

Install Chocolatey in administrative mode on your terminal with the following command:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

And then follow the instructions for your system to install Node.js here:
https://nodejs.org

Verify installation with:
node -v
npm -v

## Install Java JDK 17

Go to: https://adoptium.net/temurin/releases?version=17&os=any&arch=any

And install JDK17. Verify with: 

java -version

## Install Android Studio

Install Android Studios. We are using Otter 3:

https://developer.android.com/studio/archive

Install with default options, and make sure the following components are installed:

*Android SDK
*SDK Platform Tools
*SDK Build Tools
*Android Emulator
*Virtual Device Manager

## Install Android 16 SDK

Open Android Studio and click More Actions -> SDK Manager

Under SDK Platforms, select: **Android 16 ("Baklava")

Under SDK Tools, ensure the following are installed:
*Android SDK Build Tools
*Android Emulator
*Android SDK Platform Tools

And click Apply

## Configure Environment Variables

On your system open: Edit System Environment Variables

Click: Environment Variables

Create: ANDROID_HOME

Variable Name: ANDROID_HOME
Variable Value: C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk

And add to PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator

Then restart your computer

## Create a React Native Project

In Command Prompt or PowerShell:

npx @react-native-community/cli init AppName

Enter project: cd AppName

## Create Android Emulator

Click: More Actions -> Virtual Device Manager -> Create Device

Select: Pixel 8

Click: Next -> Android 16 ("Buklava") -> Finish

Start Emulator

To make sure the app is running, run the following command to open Metro:

npx react-native start

And in a separate terminal:

npx react-native run-android

And the app should launch!