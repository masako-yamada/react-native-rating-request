import React, { Platform, Alert, Linking, NativeModules } from 'react-native';
import _ from 'lodash';

import RatingsData from './RatingsData';

const { StoreReview } = NativeModules;
const SKStoreReviewAvailable = !!StoreReview && StoreReview.SKStoreReviewAvailable;

function requestReview() {
  if (!StoreReview) {
    throw new Error('StoreReview native module not available.');
  }
  if (!SKStoreReviewAvailable) {
    throw new Error('StoreReview is not available on this version of iOS');
  }
  return StoreReview.requestReview();
}

function showReviewDialog(storeUrl) {
	Alert.alert(
		this.config.title, 
		this.config.message, 
		[
			{ text: this.config.actionLabels.accept, onPress: () => { 
				if (SKStoreReviewAvailable) {
					requestReview();
				} else {
					Linking.openURL(storeUrl);
				}
				RatingsData.recordRated(); 
				this.config.callbacks.accept();
			} },
			{ text: this.config.actionLabels.delay, onPress: () => { this.config.callbacks.delay(); } },
			{ text: this.config.actionLabels.decline, onPress: () => { RatingsData.recordDecline(); this.config.callbacks.decline(); } },
		]
	);
}

const defaultConfig = {
	enjoyingMessage: 'Are you enjoying this app?',
	enjoyingActions: {
		accept: 'Yes!',
		decline: 'Not really',
	},
	callbacks: {
		enjoyingApp: () => {},
		notEnjoyingApp: () => {},
		accept: () => {},
		delay: () => {},
		decline: () => {},
	},
	title: 'Rate Us!',
	message: 'How about a rating on the app store?',
	iOSAppStoreId: null,
	androidAppStoreId: null,
	actionLabels: {
		accept: 'Ok, sure',
		delay: 'Remind me later',
		decline: 'No, thanks',
	},
	eventsUntilPrompt: 1,
	usesUntilPrompt: 1,
	daysBeforeReminding: 1,
	showIsEnjoyingDialog: true,
	debug: false,
};

/**
 * Creates the RatingRequester object you interact with
 * @class
 */
export default class RatingRequester {

	/**
	 * @param  {string} iOSAppStoreId - Required. The iOS ID used in the app's respective app store
	 * @param  {string} androidAppStoreId - Required. The android ID used in the app's respective app store
	 * @param  {object} options - Optional. Override the defaults. Takes the following shape, with all elements being optional:
	 * 								{
	 * 									enjoyingMessage: {string},
	 * 									enjoyingActions: {
	 * 										accept: {string},
	 * 										decline: {string},
	 * 									},
	 * 									callbacks: {
	 * 										enjoyingApp: {function},
	 * 										notEnjoyingApp: {function},
	 * 										accept: {function},
	 * 										delay: {function},
	 * 										decline: {function},
	 * 									},
	 * 									title: {string},
	 * 									message: {string},
	 * 									actionLabels: {
	 * 										decline: {string},
	 * 										delay: {string},
	 * 										accept: {string}
	 * 									},
	 *									eventsUntilPrompt: {number},
	 *									usesUntilPrompt: {number},
	 *									daysBeforeReminding: {number},
	 *									debug: {bool},
	 * 								}
	 */
	constructor(iOSAppStoreId, androidAppStoreId, config) {
		// Check for required options
		if (!iOSAppStoreId || !androidAppStoreId) {
			throw 'You must specify your app\'s store ID on construction to use the Rating Requester.';
		}

		// Merge defaults with user-supplied config
		this.config = _.merge({}, defaultConfig, config);
		this.config.iOSAppStoreId = iOSAppStoreId;
		this.config.androidAppStoreId = androidAppStoreId;

		this.isAwaitingRating = this.isAwaitingRating.bind(this);
		_.bindAll(this,
			'isAwaitingRating',
			'showRatingDialog',
			'checkToShowDialog',
			'handleUse',
			'handlePositiveEvent',
		);
	}

	async isAwaitingRating() {
		let timestamps = await RatingsData.getActionTimestamps();
		let rated = timestamps[0];
		let declined = timestamps[1];
		let daysSinceLastSeen = Math.floor((Date.now() - parseInt(timestamps[2]))/1000/60/60/24);
		if (!this.config.debug && [rated, declined].some((time) => time[1] !== null)) {
			return false;
		}

		let usesCount = await RatingsData.getUsesCount();
		let eventCounts = await RatingsData.getEventCount();

		return this.config.debug || usesCount >= this.config.usesUntilPrompt || eventCounts >= this.config.eventsUntilPrompt || daysSinceLastSeen > this.config.daysBeforeReminding;
	}

	/**
	 * Shows the rating dialog when called. Normally called by `handlePositiveEvent()`, but
	 * can be called on its own as well. Use caution when doing so--you don't want to ask
	 * the user for a rating too frequently or you might annoy them. (This is handy, however,
	 * if the user proactively seeks out something in your app to leave a rating, for example.)
	 *
	 */
	async showRatingDialog() {
		await RatingsData.recordRatingSeen();

		let storeUrl = Platform.OS === 'ios' ?
			'http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=' + this.config.iOSAppStoreId + '&pageNumber=0&sortOrdering=2&type=Purple+Software&mt=8' :
			'market://details?id=' + this.config.androidAppStoreId;

		if (this.config.showIsEnjoyingDialog)
			Alert.alert(
				this.config.enjoyingMessage,
				'',
				[
					{ text: this.config.enjoyingActions.accept, onPress: () => {
						this.config.callbacks.enjoyingApp();
						showReviewDialog(storeUrl);
					}},
					{ text: this.config.enjoyingActions.decline, onPress: () => {
						RatingsData.recordDecline();
						this.config.callbacks.notEnjoyingApp();
					}, style: 'cancel'},
				],
			);
		else
			showReviewDialog(storeUrl);

		// clear the events and uses
		await RatingsData.clearKeys();
	}

	async checkToShowDialog() {
		if (await this.isAwaitingRating()) {
			this.showRatingDialog();
		}
	}
	async handleUse() {
		await RatingsData.incrementUsesCount();
		await this.checkToShowDialog();
	}
	/**
	 * Call when a positive interaction has occurred within your application. Depending on the number
	 * of times this has occurred and your timing function, this may display a rating request dialog.
	 *
	 */
	async handlePositiveEvent() {
		await RatingsData.incrementEventCount();
		await this.checkToShowDialog()
	}
}
