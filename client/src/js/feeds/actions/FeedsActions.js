"use strict";

import FeedApplicationQueries from "../../feeds/db/FeedApplicationQueries.js";
import FeedDb from "../../feeds/db/FeedDb.js";
import PouchClient from "../../db/PouchClient";
import { displayParkedFeedsAsync, removeUnParkItem } from "../../park/actions/ParkActions"
import { displayAllFeedsAsync, getLatestFeedsFromAllSources, removeParkItem } from "../../surf/actions/AllFeedsActions";

export const INCREMENT_PARK_COUNTER = "INCREMENT_PARK_COUNTER";
export const DECREMENT_PARK_COUNTER = "DECREMENT_PARK_COUNTER";
export const INITIALISE_PARK_COUNTER = "INITIALISE_PARK_COUNTER";
export function parkFeed(feedDoc) {
    if(feedDoc && Object.keys(feedDoc).length !== 0) {
        return dispatch => {
            FeedApplicationQueries.updateFeed(feedDoc, "park").then(() => {
                dispatch(parkFeedCounter());
                dispatch(removeParkItem(feedDoc));
            });
        };
    }
}
export function unparkFeed(feedDoc) {
    if (feedDoc && Object.keys(feedDoc).length !== 0) {

        return dispatch => {
            if (feedDoc.sourceId === "") {
                PouchClient.deleteDocument(feedDoc).then(() => {
                    dispatch(unparkFeedCounter());
                    dispatch(removeUnParkItem(feedDoc));
            });
            } else {
                let status = "surf";
                FeedApplicationQueries.updateFeed(feedDoc, status).then(() => {
                    dispatch(unparkFeedCounter());
                    dispatch(removeUnParkItem(feedDoc));

            });
            }

        };
    }
}

export function initialiseParkedFeedsCount() {
    return dispatch => {
        FeedDb.parkedFeedsCount().then((count) => {
            dispatch(getParkFeedCounter(count));
        });
    };
}

function parkFeedCounter() {
    return { "type": INCREMENT_PARK_COUNTER };
}

function unparkFeedCounter() {
    return { "type": DECREMENT_PARK_COUNTER };
}

function getParkFeedCounter(count) {
    return { "type": INITIALISE_PARK_COUNTER, count };
}
