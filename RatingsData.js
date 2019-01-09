import React, { AsyncStorage } from 'react-native';

const keyPrefix = '@ReactNativeRatingRequest.';
const eventCountKey = keyPrefix + 'EventCount';
const usesCountKey = keyPrefix + 'usesCount';
const ratedTimestamp = keyPrefix + 'ratedTimestamp';
const declinedTimestamp = keyPrefix + 'declinedTimestamp';
const lastSeenTimestamp = keyPrefix + 'lastSeenTimestamp';

/**
 * Private class that let's us interact with AsyncStorage on the device
 * @class
 */
class RatingsData {

	constructor() {
		this.initialize();
	}

	async getKey(key) {
		try {
			let string = await AsyncStorage.getItem(key);
			return parseInt(string, 10);
		} catch (ex) {
			console.warn('Couldn\'t retrieve ' + key + '. Error:', ex);
		}
	}

	async incrementKey(key) {
		try {
			let currentCount = await this.getKey(key);
			await AsyncStorage.setItem(key, (currentCount + 1).toString());

			return currentCount + 1;
		} catch (ex) {
			console.warn('Could not increment count' + key + '. Error:', ex);
		}
	}

	async getUsesCount() {
		return await this.getKey(usesCountKey);
	}

	async incrementUsesCount() {
		return await this.incrementKey(usesCountKey);
	}

	// Get current count of positive events
	async getEventCount() {
		return await this.getKey(eventCountKey);
	}

	// Increment count of positive events
	async incrementEventCount() {
		return await this.incrementKey(eventCountKey);
	}

	async getActionTimestamps() {
		try {
			let timestamps = await AsyncStorage.multiGet([ratedTimestamp, declinedTimestamp, lastSeenTimestamp]);

			return timestamps;
		} catch (ex) {
			console.warn('Could not retrieve rated or declined timestamps.', ex);
		}
	}

	async recordRatingSeen() {
		try {
			await AsyncStorage.setItem(lastSeenTimestamp, Date.now().toString());
		} catch (ex) {
			console.warn('Couldn\'t set declined timestamp.', ex);
		}
	}

	async recordDecline() {
		try {
			await AsyncStorage.setItem(declinedTimestamp, Date.now().toString());
		} catch (ex) {
			console.warn('Couldn\'t set declined timestamp.', ex);
		}
	}

	async recordRated() {
		try {
			await AsyncStorage.setItem(ratedTimestamp, Date.now().toString());
		} catch (ex) {
			console.warn('Couldn\'t set rated timestamp.', ex);
		}
	}

	async initializeKeyIfNull(key) {
		let val = await AsyncStorage.getItem(key);
		if (val === null) {
			console.log('initializing ' + key);
			await AsyncStorage.setItem(key, '0');
		}
	}

	// Initialize keys, if necessary
	async initialize() {
		try {
			let keys = [eventCountKey,usesCountKey];
			for (var i = keys.length - 1; i >= 0; i--) {
				await this.initializeKeyIfNull(keys[i]);
			}
		} catch (ex) {
			// report error or maybe just initialize the values?
			console.warn('Uh oh, something went wrong initializing values!', ex);
		}
	}

	async clearKeys() {
		const keys = [eventCountKey,usesCountKey];
		for (var i = keys.length - 1; i >= 0; i--) {
			await AsyncStorage.setItem(keys[i],'0');
		}
	}
}

export default new RatingsData();