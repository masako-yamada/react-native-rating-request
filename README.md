# react-native-rating-request

A React Native component to prompt users for a rating after positive interactions

The Rating Requester is a very simple JS module that you simply instantiate and call from time to time, as your user performs actions that result in a "happy path." For example, maybe your users get a smile on their face every time they save money with your app, beat a level, or clear out their inbox. After a certain number of these positive events, it might be a good time to ask the user for a review.

## Installation

    npm i --save react-native-rating-request
    react-native link react-native-rating-request

## Usage

### Basics

Import and create a new instantiation of the Rating Requester somewhere in the main portion of your application:

````javascript
    import RatingRequester from 'react-native-rating-request';
    let RatingTracker = new RatingRequester('[your ios app store ID]', '[your android app store id]');

    let MyApp = React.createClass({ ... });
````
When a positive UX event occurs, let the Rating Requester know so that it can keep track of these:

````javascript
	if (user_saved_the_world) {
		RatingTracker.handlePositiveEvent();
	}
````
If enough positive events have occurred (defined by the `timingFunction`) then a rating dialog will pop up. The user can rate the app or decline to rate, in which case they won't be bothered again, or can choose to maybe do so later, in which case the Rating Requester will keep on tracking positive event counts.

You can also trigger the rating dialog to appear immediately by invoking `RatingTracker.showRatingDialog([callback])`. If you have a "Rate this App" button or link in an about page or something in your app, this would be a good place to use that.


### Callbacks

Callbacks can be provided to the initial configuration to handle user actions. Available callbacks are 


- **enjoyingApp**: Called when a user says that they are enjoying the app. You can use this to track user enjoyment if they say they are enjoying, but ultimately choose not to rate it
- **notEnjoyingApp**: Called when a user says that they are not enjoying the app. You can use this, for example, to request feedback from the user to find out why they are not enjoying the app.
- **accept**: Called when a user says that they will rate the app.
- **delay**: Called when a user says they don't currently want to rate the app, but would like to later.
- **decline**: Called when a user declines to rate the app, but after they have already said they are enjoying it.

## Configuration

All configuration occurs on the construction of a new RatingRequester.

````javascript
    let myRR = new RatingRequester(iosAppStoreId, androidAppStoreId, [ options ]);
````

You *must* pass in a string as the first parameter, which is the app store ID of your application. Optionally, but highly suggested, is a second parameter: a set of options to customize the request dialog and the timing of the dialog. This object follows this pattern:

````javascript
  {
    enjoyingMessage: {string},
    enjoyingActions: {
      accept: {string},
      decline: {string},
    },
    callbacks: {
      enjoyingApp: {function},
      notEnjoyingApp: {function},
      accept: {function},
      delay: {function},
      decline: {function},
    },
    title: {string},
    message: {string},
    actionLabels: {
      decline: {string},
      delay: {string},
      accept: {string}
    },
    eventsUntilPrompt: {number},
    usesUntilPrompt: {number},
    daysBeforeReminding: {number},
    showIsEnjoyingDialog: {bool},
    showRateReviewDialogIOS: [bool],
    debug: {bool},
    timingFunction: {function}
  }
````

- `enjoyingMessage`: A string used as the dialog for are you enjoying this app,
- `enjoyingActions`: An object with three properties (all required if you don't want weird blanks or OKs):
  - `decline`: The "no thanks, your app sucks" button label
  - `accept`: The "yes I love this app so much" button label
- `callbacks`: Callbacks for various actions; see callbacks section above.
- `title`: A string used as the title for the dialog (e.g., "Please rate me!")
- `message`: The message you'd like to show the user (e.g., "If you are loving [my app's name], would you please leave me a positive review?")
- `actionLabels`: An object with three properties (all required if you don't want weird blanks or OKs):
  - `decline`: The "no thanks, I don't want to ever rate this" button label
  - `delay`: The "maybe I'll rate this later if I'm feeling charitable" button label
  - `accept`: The "oh my gosh I love this app so much so I'll rate it right now" button label
- `showIsEnjoyingDialog`: A boolean to show the "Are you enjoying this app?" dialog before showing the rating dialog
- `showRateReviewDialogIOS`: A boolean to show a alert asking the user for the rating, before showing the actual rating alert (Only IOS)
- `timingFunction`: A method that takes the configuration object, the rated and declined date, the current total count of uses and the current total count of positive events.


````javascript
  timingFunction: (config, ratedTimestamp, declinedTimestamp, lastSeenTimestamp, usesCount, eventCounts) => {
		let daysSinceLastSeen = Math.floor((Date.now() - parseInt(lastSeenTimestamp))/1000/60/60/24);
		if (!config.debug && [ratedTimestamp, declinedTimestamp].some((time) => time[1] !== null)) {
			return false;
		}
		
		return config.debug 
			|| usesCount >= config.usesUntilPrompt 
			|| eventCounts >= config.eventsUntilPrompt 
			|| daysSinceLastSeen > config.daysBeforeReminding;
	}
````

## Credits

Project based on
[react-native-rating-requestor](https://github.com/jlyman/react-native-rating-requestor)
and
[rn-rating-requester](https://github.com/rizzomichaelg/rn-rating-requester)

## Releases

### 3.2.4
  - Added `showRateReviewDialogIOS` configuration.

### 3.2.3
- Added `showIsEnjoyingDialog` and `timingFunction` configurations.

### 3.1.0
- Added "Are you enjoying this app?" dialog before actually requesting a rating.
- **Breaking Changes**:
  - Callbacks are now handled differently: see callbacks section and configuration for more details.

### 3.0.0
- Now supports iOS native SKStoreReviewController

### 2.0.0
- Supports Android, requires RN v0.20.0+, and added `showRatingDialog()` thanks to [@maximilianhurl](https://github.com/maximilianhurl).

### 1.1.0
- Added an optional callback to `handlePositiveEvent()` that reports on the result of the handling. Props to [@sercanov](https://github.com/sercanov).

### 1.0.0
- Initial release