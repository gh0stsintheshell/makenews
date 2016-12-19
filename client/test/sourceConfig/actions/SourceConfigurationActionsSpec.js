import { expect } from "chai";
import UserSession from "../../../src/js/user/UserSession";
import AjaxClient from "../../../src/js/utils/AjaxClient";
import mockStore from "../../helper/ActionHelper";
import * as sourceConfigActions from "./../../../src/js/sourceConfig/actions/SourceConfigurationActions";
import * as WebConfigActions from "./../../../src/js/config/actions/WebConfigureActions";
import * as FbActions from "./../../../src/js/config/actions/FacebookConfigureActions";
import sinon from "sinon";
import AppWindow from "../../../src/js/utils/AppWindow";
import HttpResponseHandler from "../../../../common/src/HttpResponseHandler";
import nock from "nock";

describe("SourceConfigurationActions", () => {
    describe("configured sources", () => {
        let sandbox = null;

        beforeEach("configured sources", () => {
            sandbox = sinon.sandbox.create();
        });

        afterEach("configured sources", () => {
            sandbox.restore();
        });

        it(`should return ${sourceConfigActions.GOT_CONFIGURED_SOURCES} action when it receives configured sources`, () => {
            let sources = [{ "name": "Profile1" }, { "name": "Profile2" }];
            let action = sourceConfigActions.configuredSourcesReceived(sources);
            expect(action.type).to.equal(sourceConfigActions.GOT_CONFIGURED_SOURCES);
            expect(action.sources).to.deep.equal(sources);
        });

        it(`should dispatch ${sourceConfigActions.GOT_CONFIGURED_SOURCES} once it gets the configured sources from server`, (done) => {
            let sources = { "profiles": [{ "name": "Profile1" }, { "name": "Profile2" }],
                "pages": [], "groups": [], "twitter": [], "web": [] };

            sandbox.mock(UserSession).expects("instance").returns({
                "continueSessionIfActive": () => {}
            });
            let ajaxClient = AjaxClient.instance("/configuredSources", false);
            sandbox.mock(AjaxClient).expects("instance").withArgs("/configuredSources", false).returns(ajaxClient);
            sandbox.stub(ajaxClient, "get").withArgs().returns(Promise.resolve(sources));

            let store = mockStore({}, [{ "type": sourceConfigActions.GOT_CONFIGURED_SOURCES, "sources": sources }], done);
            store.dispatch(sourceConfigActions.getConfiguredSources());
        });
    });

    describe("source results", () => {
        it(`should return ${sourceConfigActions.NO_MORE_SOURCE_RESULTS} when request for noMoreSourceResults action`, () => {
            expect(sourceConfigActions.noMoreSourceResults()).to.deep.equal({ "type": sourceConfigActions.NO_MORE_SOURCE_RESULTS });
        });

        it(`should return ${sourceConfigActions.HAS_MORE_SOURCE_RESULTS} when request for hasMoreSourceResults action`, () => {
            expect(sourceConfigActions.hasMoreSourceResults()).to.deep.equal({ "type": sourceConfigActions.HAS_MORE_SOURCE_RESULTS });
        });

        it(`should return ${sourceConfigActions.CLEAR_SOURCES} when request for clearSources action`, () => {
            expect(sourceConfigActions.clearSources()).to.deep.equal({ "type": sourceConfigActions.CLEAR_SOURCES });
        });
    });

    describe("switch current Tab", () => {
        it("should return the FACEBOOK_CHANGE_CURRENT_TAB action", () => {
            let currentTab = "Profiles";
            let facebookSourceTabSwitch = sourceConfigActions.switchSourceTab(currentTab);
            expect(facebookSourceTabSwitch.type).to.equal(sourceConfigActions.CHANGE_CURRENT_SOURCE_TAB);
            expect(facebookSourceTabSwitch.currentTab).to.equal(currentTab);
        });
    });

    describe("getSources", () => {
        let sandbox = null;
        let keyword = "bla";
        beforeEach("", () => {
            sandbox = sinon.sandbox.create();
        });

        afterEach("", () => {
            sandbox.restore();
        });

        it("should delegate to fetchFacebookSources for pages if sourceType is pages", () => {
            let fetchFacebookPagesMock = sandbox.mock(FbActions).expects("fetchFacebookSources")
                .withArgs(keyword, "page", FbActions.PAGES, {});
            sourceConfigActions.getSources(FbActions.PAGES, keyword, {});
            fetchFacebookPagesMock.verify();
        });

        it("should delegate to fetchFacebookSources for groups if sourceType is groups", () => {
            let fetchFacebookPagesMock = sandbox.mock(FbActions).expects("fetchFacebookSources")
                .withArgs(keyword, "group", FbActions.GROUPS, {});
            sourceConfigActions.getSources(FbActions.GROUPS, keyword, {});
            fetchFacebookPagesMock.verify();
        });

        it("should delegate to fetchFacebookSources for profiles if sourceType is profiles", () => {
            let fetchFacebookPagesMock = sandbox.mock(FbActions).expects("fetchFacebookSources")
                .withArgs(keyword, "profile", FbActions.PROFILES, {});
            sourceConfigActions.getSources(FbActions.PROFILES, keyword, {});
            fetchFacebookPagesMock.verify();
        });
    });

    describe("add source to configured list", () => {
        let sandbox = null, sources = null, configuredSources = null;

        beforeEach("add source to configred list", () => {
            sources = [{ "name": "something", "id": "432455" }];
            configuredSources = [{ "name": "something", "id": "432455", "url": "432455" }];
            sandbox = sinon.sandbox.create();
        });

        afterEach("add source to configred list", () => {
            sandbox.restore();
        });

        it(`should dispatch ${FbActions.FACEBOOK_ADD_PROFILE} when requested for adding profile`, (done) => {
            let appWindow = new AppWindow();
            sandbox.mock(AppWindow).expects("instance").returns(appWindow);
            sandbox.stub(appWindow, "get").withArgs("serverUrl").returns("http://localhost");

            sandbox.mock(UserSession).expects("instance").returns({
                "continueSessionIfActive": () => {}
            });

            nock("http://localhost")
                .put("/facebook/configureSource")
                .reply(HttpResponseHandler.codes.OK, { "ok": true });

            let store = mockStore({}, [{ "type": FbActions.FACEBOOK_ADD_PROFILE, "sources": configuredSources }], done);
            store.dispatch(sourceConfigActions.addSourceToConfigureList(FbActions.PROFILES, ...sources));
        });

        it(`should dispatch ${FbActions.FACEBOOK_ADD_PAGE} when requested for adding page`, (done) => {
            let appWindow = new AppWindow();
            sandbox.mock(AppWindow).expects("instance").returns(appWindow);
            sandbox.stub(appWindow, "get").withArgs("serverUrl").returns("http://localhost");

            sandbox.mock(UserSession).expects("instance").returns({
                "continueSessionIfActive": () => {}
            });

            nock("http://localhost")
                .put("/facebook/configureSource")
                .reply(HttpResponseHandler.codes.OK, { "ok": true });

            let store = mockStore({}, [{ "type": FbActions.FACEBOOK_ADD_PAGE, "sources": configuredSources }], done);
            store.dispatch(sourceConfigActions.addSourceToConfigureList(FbActions.PAGES, ...sources));
        });

        it(`should dispatch ${FbActions.FACEBOOK_ADD_GROUP} when requested for adding group`, (done) => {
            let appWindow = new AppWindow();
            sandbox.mock(AppWindow).expects("instance").returns(appWindow);
            sandbox.stub(appWindow, "get").withArgs("serverUrl").returns("http://localhost");

            sandbox.mock(UserSession).expects("instance").returns({
                "continueSessionIfActive": () => {}
            });

            nock("http://localhost")
                .put("/facebook/configureSource")
                .reply(HttpResponseHandler.codes.OK, { "ok": true });

            let store = mockStore({}, [{ "type": FbActions.FACEBOOK_ADD_GROUP, "sources": configuredSources }], done);
            store.dispatch(sourceConfigActions.addSourceToConfigureList(FbActions.GROUPS, ...sources));
        });

        it(`should dispatch ${WebConfigActions.WEB_ADD_SOURCE} when requested for adding group`, (done) => {
            let appWindow = new AppWindow();
            sandbox.mock(AppWindow).expects("instance").returns(appWindow);
            sandbox.stub(appWindow, "get").withArgs("serverUrl").returns("http://localhost");

            sandbox.mock(UserSession).expects("instance").returns({
                "continueSessionIfActive": () => {}
            });

            nock("http://localhost")
                .put("/facebook/configureSource")
                .reply(HttpResponseHandler.codes.OK, { "ok": true });

            let store = mockStore({}, [{ "type": WebConfigActions.WEB_ADD_SOURCE, "sources": sources }], done);
            store.dispatch(sourceConfigActions.addSourceToConfigureList(sourceConfigActions.WEB, ...sources));
        });

        it(`should dispatch ${FbActions.FACEBOOK_ADD_PROFILE} by default`, () => {
            let event = sourceConfigActions.addSourceToConfigureList("", { "name": "something" });
            expect(event.type).to.equal(FbActions.FACEBOOK_ADD_PROFILE);
            expect(event.sources).to.deep.equal([{ "name": "something" }]);
        });
    });
});
