
# GeoMapCam

**GeoMapCam** is a React Native mobile application designed to seamlessly capture photos with embedded geographic metadata (GPS coordinates). It offers a modern and intuitive interface for photographers, travelers, and surveyors needing precise location tagging on their images.

***

## 🌟 Overview

Location-aware photography is essential for documenting places with contextual accuracy.  
**GeoMapCam** empowers users to capture images enriched with geolocation data, making it easy to organize, search, and share photos tied to specific places.
***

## 🚀 Key Features

* Capture photos with embedded GPS coordinates  
* Fast refresh development experience with React Native CLI  
* Simple UI optimized for quick photo capture and preview  
* Modular codebase designed for easy feature extension  
* Offline-capable camera and location services integration  

***

## 🛠️ Tech Stack

* **Mobile App:** React Native, TypeScript  
* **Build System:** React Native CLI  
* **Development Tools:** Metro bundler, CocoaPods for iOS dependencies

***

## 💡 Project Setup

### Start Metro

Run Metro, the JavaScript bundler, in the project root:

```bash
npm start
# or
yarn start
```

### Build and Run App

Run the app on your target platform:

#### Android

```bash
npm run android
# or
yarn android
```

***

## 📂 Folder Structure

```
GeoMapCam
│
├── android/                 # Native Android codebase (Kotlin)
├── ios/                     # Native iOS codebase (Swift)
├── src/                     # React Native source files (TypeScript)
│   ├── components/          # UI components
│   ├── screens/             # App screens
│   ├── services/            # Camera and location utilities
│   └── hooks/               # Custom hooks
└── scripts/                 # Build tools and scripts
```
