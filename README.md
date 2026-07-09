# Space Escape Runner 🚀

A simple 2D space-themed endless runner game built with React Native and Expo — created as a beginner learning project, from first "Hello World" screen all the way to a published Android build.

## About the Game

Pilot a spaceship left and right to dodge falling asteroids. Every asteroid you avoid increases your score. Every few points, your level goes up — and asteroids fall faster. Survive as long as you can and try to beat your personal best!

## Features

- Shape-based spaceship and asteroid design (no images used — pure React Native Views)
- Left/right movement controls with screen boundary limits
- Continuously falling asteroids with random spawn positions
- Difficulty that increases with level (faster asteroid fall speed)
- Collision detection between spaceship and asteroid
- Game Over screen showing final score and level reached
- Local high score saved permanently on-device using AsyncStorage
- Gradient background, starfield, and smooth animations (Animated API)
- Fully working Restart/Play Again functionality

## Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/) (Expo Router)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for persistent high scores
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) for the background

## How to Run Locally

1. Clone this repository
```bash
   git clone https://github.com/Errorcom-Pm/SpaceEscapeRunner.git
```
2. Navigate into the project folder
```bash
   cd SpaceEscapeRunner
```
3. Install dependencies
```bash
   npm install
```
4. Start the development server
```bash
   npx expo start
```
5. Scan the QR code shown in the terminal using the **Expo Go** app (Android/iOS) to run it on your phone

## Android Build

This project has also been built into a standalone Android APK using EAS Build, so it can run without Expo Go at all.

## Author

Built by [Errorcom-Pm](https://github.com/Errorcom-Pm) as a hands-on React Native / Expo learning project.