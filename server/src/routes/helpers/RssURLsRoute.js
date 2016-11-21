/* eslint consistent-this:0*/
import StringUtil from "../../../../common/src/util/StringUtil";
import RssRequestHandler from "../../rss/RssRequestHandler";
import Route from "./Route";
import RouteLogger from "../RouteLogger";

export default class RssURLsRoute extends Route {
    constructor(request, response, next) {
        super(request, response, next);
        this.url = this.request.query.url;
    }

    valid() {
        if(Object.keys(this.url).length === 0) {
            return false;
        }
        return true;
    }

    handle() {
        if(!this.valid()) {
            RouteLogger.instance().warn("RssFeedsRoute:: invalid rss feed url %s.", this.url);
            return this._handleInvalidRoute();
        }
        let rssRequestHandler = RssRequestHandler.instance();
        rssRequestHandler.searchUrl(this.url).then(feeds => {
            RouteLogger.instance().debug("Rss URL's Route:: successfully searched for the url %s .", this.url);
            this._handleSuccess(feeds);
        }).catch(error => { //eslint-disable-line
            RouteLogger.instance().debug("RssFeedsRoute:: failed to search for url  %s. Error: %s", this.url, error);
            this._handleBadRequest();
        });
    }
}
