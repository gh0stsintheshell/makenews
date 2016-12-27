import AjaxClient from "../../../js/utils/AjaxClient";
import { newsBoardSourceTypes } from "./../../utils/Constants";

export const PAGINATED_FETCHED_FEEDS = "PAGINATED_FETCHED_FEEDS";
export const NEWSBOARD_CURRENT_TAB = "NEWSBOARD_CURRENT_TAB";
export const CLEAR_NEWS_BOARD_FEEDS = "CLEAR_NEWS_BOARD_FEEDS";

export const paginatedFeeds = feeds => ({
    "type": PAGINATED_FETCHED_FEEDS, feeds
});

export const newsBoardTabSwitch = currentTab => ({
    "type": NEWSBOARD_CURRENT_TAB, currentTab
});

export const clearFeeds = () => ({
    "type": CLEAR_NEWS_BOARD_FEEDS
});

export function displayFeedsByPage(pageIndex, sourceType, callback = () => {}) {
    let ajax = AjaxClient.instance("/fetch-all-feeds", true);
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    return async dispatch => {
        try {
            let feeds = await ajax.post(headers, { "offset": pageIndex, "sourceType": handleSourceType(sourceType) });
            let result = {
                "docsLength": 0
            };
            if (feeds.docs.length > 0) { //eslint-disable-line no-magic-numbers
                dispatch(paginatedFeeds(feeds.docs));
                result.docsLength = feeds.docs.length;
            }
            let defaultPageSize = 25;
            result.hasMoreFeeds = feeds.docs.length === defaultPageSize;
            callback(result); //eslint-disable-line callback-return
        } catch(err) {
            dispatch(paginatedFeeds([]));
        }
    };
}

function handleSourceType(sourceType) {
    switch (sourceType) {
    case newsBoardSourceTypes.trending:
        return newsBoardSourceTypes.trending;
    case newsBoardSourceTypes.web:
        return newsBoardSourceTypes.web;
    case newsBoardSourceTypes.facebook:
        return newsBoardSourceTypes.facebook;
    case newsBoardSourceTypes.twitter:
        return newsBoardSourceTypes.twitter;
    default:
        return "";
    }
}
