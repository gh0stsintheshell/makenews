/* eslint no-use-before-define:0, no-unused-expressions: 0 */

import moment from "moment";
import LogoutActions from "../login/LogoutActions";
import AppSessionStorage from "../utils/AppSessionStorage";
import AjaxClient from "../utils/AjaxClient";
import AppWindow from "../utils/AppWindow";
import { getConfiguredSources } from "../sourceConfig/actions/SourceConfigurationActions";

const leadTime = 120000, minuteToMilliSeconds = 60000;

export default class UserSession {

    constructor() {
        this.sessionTime = (AppWindow.instance().get("dbSessionInterval") * minuteToMilliSeconds) - leadTime;
    }

    static instance() {
        if(!UserSession.session) {
            UserSession.session = new UserSession();
        }
        return UserSession.session;
    }

    init(dispatch) {
        if(!this.initialized) {
            dispatch(getConfiguredSources());
            this.setLastAccessedTime();
            this.sessionTimer = setInterval(() => this.renewSession(), this.sessionTime);
            this.initialized = true;
        }
    }

    getLastAccessedTime() {
        return AppSessionStorage.instance().getValue(AppSessionStorage.KEYS.LAST_RENEWED_TIME);
    }

    setLastAccessedTime(time = moment().valueOf()) {
        AppSessionStorage.instance().setValue(AppSessionStorage.KEYS.LAST_RENEWED_TIME, time);
    }

    renewSession() {
        let currentTime = moment().valueOf();
        if(!this.isActiveContinuously(currentTime)) {
            clearInterval(this.sessionTimer);
            this.autoLogout();
            return;
        }
        AjaxClient.instance("/renew_session", true).get();
    }

    isActiveContinuously(time = moment().valueOf()) {
        return time - this.getLastAccessedTime() < (this.sessionTime - leadTime);
    }

    autoLogout() {
        LogoutActions.instance().logout();
    }
}
