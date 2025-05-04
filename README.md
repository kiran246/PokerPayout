# Poker Settlement App

A mobile application designed to help poker players easily track and settle debts after a poker game, with minimal transactions.

## Features

- **Player Management**: Add, edit, and manage poker players
- **Balance Tracking**: Record each player's winnings or losses after a game
- **Optimized Settlements**: Get the most efficient way to settle debts with minimal transactions
- **Session History**: Track game history and see settlement details
- **Analytics**: View player statistics and performance over time
- **Offline Support**: All data stored locally on your device
- **Sharing**: Share settlement details with other players

## Technology Stack

- React Native
- Expo
- Redux & Redux Persist for state management
- React Navigation
- Expo LinearGradient for UI effects
- React Native Gesture Handler for swipe interactions
- React Native Chart Kit for analytics visualizations

## Installation

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app for iOS/Android for testing

### Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/poker-settlement.git
   cd poker-settlement
   ```

2. Install dependencies:
   ```
   npm install
   ```
   
3. Start the development server:
   ```
   npx expo start
   ```

4. Open the Expo Go app on your mobile device and scan the QR code from the terminal

## Project Structure

```
poker-settlement/
├── App.js             # Application entry point
├── app.json           # Expo configuration
├── assets/            # Static assets (images, fonts)
├── src/
│   ├── api/           # Storage and API functions
│   ├── components/    # Reusable UI components
│   ├── navigation/    # Navigation configuration
│   ├── screens/       # Application screens
│   ├── store/         # Redux store, slices, actions
│   └── utils/         # Helper functions and utilities
```

## Usage

### Adding Players

1. From the home screen, tap the "Manage Players" card
2. Use the "+" button to add new players
3. Enter the player's name and tap "Add Player"

### Starting a Session

1. From the home screen, tap "Start New Session"
2. Enter each player's balance (positive for winners, negative for losers)
3. Tap "Calculate Settlements" to see the optimal payment plan
4. Share the results with your poker group or save for later

### Viewing History

1. From the home screen, tap "View History"
2. Browse through past sessions 
3. Tap any session to view details or share them

## Deployment

### iOS

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure your project: `eas build:configure`
3. Update app.json with your app information
4. Build for iOS: `eas build --platform ios`
5. Submit to App Store: `eas submit --platform ios`

### Android

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure your project: `eas build:configure`
3. Update app.json with your app information
4. Build for Android: `eas build --platform android`
5. Submit to Google Play: `eas submit --platform android`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername) - email@example.com

Project Link: [https://github.com/yourusername/poker-settlement](https://github.com/yourusername/poker-settlement)

## Acknowledgements

- [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit)

# Steps to Build and Deploy to Apple App Store
##1. Set Up an Apple Developer Account
If you haven't already, you'll need to:

Register for an Apple Developer Program account ($99/year) at developer.apple.com
Complete all required agreements and tax forms

##2. Prepare App for Submission

Generate an iOS Build:
Using Expo EAS (Expo Application Services):
bash# Install EAS CLI if you haven't already
npm install -g eas-cli

### Log in to your Expo account
```
eas login
```

### Configure your project for EAS Build
```
eas build:configure
```

### Create a production build for iOS
```
eas build --platform ios
```

## Create an App Record in App Store Connect:

### Log in to App Store Connect
Go to "My Apps" and click the "+" button to create a new app
Fill in the required metadata (app name, bundle ID, SKU, etc.)


### Prepare App Store Information:

App description (up to 4000 characters)
Keywords for App Store search
Support URL
Marketing URL (optional)
Privacy Policy URL
App Store screenshots (at least one set for a primary device)
App preview video (optional)



##3. Upload and Submit Your App

###Upload Your Build:

Once your EAS build completes, you can upload it directly:

```
eas submit --platform ios
```

```
Or manually upload the .ipa file using Transporter or Xcode
```

###Complete App Store Submission:

In App Store Connect, select your build
Complete the "App Review Information" section
Answer all questions in the "App Review Information" section
Fill out the "Version Information"
Complete the "Age Rating" questionnaire
Set up "App Store Pricing and Availability"
Submit for review



##4. App Review Process

Apple will review your app to ensure it meets App Store guidelines
This typically takes 1-3 business days
You'll receive notifications about the status of your review

##5. Release Your App
Once approved, you can:

##Release immediately
Schedule the release for a specific date
Manually release when you're ready

##Additional Tips for a Successful iOS App Submission

Privacy Policy: Apple requires a privacy policy for all apps. Create a comprehensive policy that explains what data your app collects.
App Tracking Transparency: If you plan to track users or access their IDFA, implement the App Tracking Transparency framework.
Testing: Thoroughly test your app on multiple iOS devices and iOS versions before submission.
Guidelines Compliance: Familiarize yourself with Apple's App Store Review Guidelines to avoid rejection.
Marketing Materials: Prepare high-quality screenshots and an app preview video to showcase your app's features.
Support Plan: Have a plan for providing ongoing support and updates for your app.
