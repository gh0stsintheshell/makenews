/* eslint no-unused-expressions:0, max-nested-callbacks: [2, 5], no-magic-numbers:0 */

import HttpResponseHandler from "../../../common/src/HttpResponseHandler";
import FacebookClient from "../../src/facebook/FacebookClient";
import NodeErrorHandler from "../../src/NodeErrorHandler";
import ApplicationConfig from "../../src/config/ApplicationConfig";
import LogTestHelper from "../helpers/LogTestHelper";
import DateUtil from "../../src/util/DateUtil";
import { isRejected } from "./../helpers/AsyncTestHelper";
import nock from "nock";
import { assert, expect } from "chai";
import sinon from "sinon";

describe("FacebookClient", () => {
    let accessToken = null, appSecretProof = null, applicationConfigFacebookStub = null, applicationConfig = null;
    before("FacebookClient", () => {
        accessToken = "test_token";
        appSecretProof = "test_secret_proof";
        applicationConfig = new ApplicationConfig();
        sinon.stub(ApplicationConfig, "instance").returns(applicationConfig);
        applicationConfigFacebookStub = sinon.stub(applicationConfig, "facebook");
        applicationConfigFacebookStub.returns({
            "url": "https://graph.facebook.com/v2.8",
            "appSecretKey": "appSecretKey",
            "timeOut": 10
        });
        sinon.stub(FacebookClient, "logger").returns(LogTestHelper.instance());
    });

    after("FacebookClient", () => {
        ApplicationConfig.instance.restore();
        applicationConfig.facebook.restore();
        FacebookClient.logger.restore();
    });

    describe("fetchFeeds", () => {
        let remainingUrl = null, userParameters = null, pageId = null;
        let sandbox = sinon.sandbox.create();
        beforeEach("fetchFeeds", () => {
            userParameters = { "fields": "link,message,picture,name,caption,place,tags,privacy,created_time,from", "limit": 100, "since": "12943678" };
            remainingUrl = `/v2.8/12345678/posts?fields=link,message,picture,name,caption,place,tags,privacy,created_time,from&limit=100&since=12943678&access_token=${accessToken}&appsecret_proof=${appSecretProof}`;
            pageId = "12345678";
        });

        afterEach("fetchFeeds", () => {
            sandbox.restore();
        });

        it("should return feeds for a public page", async () => {
            const fbResponse = {
                "data": [{ "message": "test news 1", "id": "163974433696568_957858557641481", "from": { "name": "some" } },
                    { "message": "test news 2", "id": "163974433696568_957850670975603", "from": { "name": "some" } }],
                "paging": {
                    "previous": "https://graph.facebook.com/v2.8/1608617579371619/posts?limit=25&since=1485955212&format=json",
                    "next": "https://graph.facebook.com/v2.8/1608617579371619/posts?limit=25&until=1485955212&format=json"
                }
            };

            const expectedResponse = {
                "docs": [{ "_id": "163974433696568_957858557641481",
                    "docType": "feed",
                    "type": "description",
                    "title": "",
                    "sourceType": "facebook",
                    "link": "https://www.facebook.com/163974433696568/posts/957858557641481",
                    "description": "test news 1",
                    "pubDate": null,
                    "tags": ["some"],
                    "images": [],
                    "videos": [],
                    "sourceId": "12345678" },
                { "_id": "163974433696568_957850670975603",
                    "docType": "feed",
                    "type": "description",
                    "title": "",
                    "sourceType": "facebook",
                    "link": "https://www.facebook.com/163974433696568/posts/957850670975603",
                    "description": "test news 2",
                    "pubDate": null,
                    "tags": ["some"],
                    "images": [],
                    "videos": [],
                    "sourceId": "12345678" }],
                "paging": {
                    "since": 1485955212
                }
            };

            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .reply(HttpResponseHandler.codes.OK, fbResponse);
            let type = "posts";
            let facebookClient = new FacebookClient(accessToken, appSecretProof);
            let response = await facebookClient.fetchFeeds(pageId, type, userParameters);
            assert.deepEqual(response, expectedResponse);
        });

        it("should return feeds for a public page and paging with current time if paging not there", async () => {
            const fbResponse = {
                "data": []
            };

            sandbox.stub(DateUtil, "getCurrentTime").returns(1485955212);
            const expectedResponse = {
                "docs": [],
                "paging": {
                    "since": 1485955212
                }
            };

            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .reply(HttpResponseHandler.codes.OK, fbResponse);
            let type = "posts";
            let facebookClient = new FacebookClient(accessToken, appSecretProof);

            const response = await facebookClient.fetchFeeds(pageId, type, userParameters);
            assert.deepEqual(response, expectedResponse);
        });

        it("should reject the promise if there are any errors from facebook like authentication", async () => {
            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .reply(HttpResponseHandler.codes.BAD_REQUEST, {
                    "error": {
                        "message": "Error validating access token: Session has expired on Thursday, 10-Dec-15 04:00:00 PST. The current time is Thursday, 10-Dec-15 20:23:54 PST.",
                        "type": "OAuthException",
                        "code": 190,
                        "error_subcode": 463,
                        "fbtrace_id": "AWpk5h2ceG6"
                    }
                });
            let type = "posts";
            let facebookClient = new FacebookClient(accessToken, appSecretProof);

            const exprectedMessage = {
                "code": 190,
                "error_subcode": 463,
                "fbtrace_id": "AWpk5h2ceG6",
                "type": "OAuthException",
                "message": "Error validating access token: Session has expired on Thursday, 10-Dec-15 04:00:00 PST. The current time is Thursday, 10-Dec-15 20:23:54 PST."
            };

            await isRejected(facebookClient.fetchFeeds(pageId, type, userParameters), exprectedMessage);
        });

        it("should reject if the facebook takes too long to return the data", (done) => {
            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .socketDelay(2000)
                .reply(HttpResponseHandler.codes.OK, {
                    "data":
                    [{ "message": "test news 1", "id": "163974433696568_957858557641481" },
                        { "message": "test news 2", "id": "163974433696568_957850670975603" }]
                });

            let type = "posts";
            let facebookClient = new FacebookClient(accessToken, appSecretProof);
            facebookClient.fetchFeeds(pageId, type, userParameters).catch((error) => { //eslint-disable-line
                done();
            });
        });

        it("should throw an error when access token is null", () => {
            let createFacebookClient = () => {
                return new FacebookClient(null, appSecretProof);
            };

            assert.throw(createFacebookClient, Error, "access token or application secret proof can not be null");
        });

        it("should throw an error when application secret proof is null", () => {
            let createFacebookClient = () => {
                return new FacebookClient(accessToken, null);
            };

            assert.throw(createFacebookClient, Error, "access token or application secret proof can not be null");
        });

        it("should reject with error when page name is null", (done) => {

            let facebookClient = new FacebookClient(accessToken, appSecretProof);
            facebookClient.fetchFeeds(null).catch((error) => {
                assert.strictEqual("page id cannot be empty", error.message);
                done();
            });
        });
    });

    describe("getFacebookId", () => {
        let accessToken1 = null, appSecretProof1 = null, facebookUrl1 = null, remainingUrl = null;
        before("getFacebookId", () => {
            accessToken1 = "test_token";
            appSecretProof1 = "test_secret_proof";
            facebookUrl1 = "http://www.facebook.com/test";
            remainingUrl = "/v2.8/" + facebookUrl1 + "/?access_token=" + accessToken1 + "&appsecret_proof=" + appSecretProof1;
        });

        it("should return id for a public page", (done) => {

            let response = {
                "name": "test_id",
                "id": "12345678"
            };

            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .reply(HttpResponseHandler.codes.OK, response);

            let facebookClient = new FacebookClient(accessToken1, appSecretProof1);
            facebookClient.getFacebookId(facebookUrl1).then((id) => {
                assert.deepEqual(response.id, id);
                done();
            });
        });

        it("should return id for wrong url", (done) => {

            let response = {
                "og_object": {
                    "id": "12345678",
                    "type": "website",
                    "updated_time": "2015-12-22T11:06:53+0000",
                    "url": "http://www.facebook.com/asfdjs"
                },
                "share": {
                    "comment_count": 0,
                    "share_count": 0
                },
                "id": "http://www.facebook.com/asfdjs"
            };

            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .reply(HttpResponseHandler.codes.OK, response);

            let facebookClient = new FacebookClient(accessToken1, appSecretProof1);
            facebookClient.getFacebookId(facebookUrl1).then((id) => {
                assert.deepEqual(response.id, id);
                done();
            });
        });
        it("should rejet if fetching facebook id is taking too longer", (done) => {

            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .socketDelay(2000)
                .reply(HttpResponseHandler.codes.OK, {});

            let facebookClient = new FacebookClient(accessToken1, appSecretProof1);
            facebookClient.getFacebookId(facebookUrl1).catch((error) => { //eslint-disable-line
                done();
            });
        });
    });

    describe("getLongLivedToken", () => {
        let accessToken1 = null, appSecretProof1 = null, remainingUrl = null, appId = null;
        before("getLongLivedToken", () => {
            accessToken1 = "test_token";
            appSecretProof1 = "test_secret_proof";
            appId = "123456";
            remainingUrl = "/v2.8/oauth/access_token?grant_type=fb_exchange_token&client_id=" + appId + "&client_secret=" + appSecretProof1 + "&fb_exchange_token=" + accessToken1;
        });

        it("should return long-lived token for a valid short-lived token", (done) => {

            let response = {
                "access_token": "test token",
                "token_type": "bearer",
                "expires_in": 123456
            };

            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .reply(HttpResponseHandler.codes.OK, response);

            let facebookClient = new FacebookClient(accessToken1, appSecretProof1, appId);
            facebookClient.getLongLivedToken().then((result) => {
                assert.deepEqual(response.id, result.id);
                done();
            });
        });

        it("should reject if long-lived token from fb response is throw error", (done) => {
            nock("https://graph.facebook.com")
                .get(remainingUrl)
                .replyWithError("error");

            let facebookClient = new FacebookClient(accessToken1, appSecretProof1, appId);
            facebookClient.getLongLivedToken().catch((error) => {
                assert.strictEqual(error.message, "error");
                done();
            });
        });
    });
    
    describe("getProfiles", () => {
        let nodeErrorHandlerMock = null, sandbox = null;

        beforeEach("getProfiles", () => {
            sandbox = sinon.sandbox.create();
            nodeErrorHandlerMock = sandbox.mock(NodeErrorHandler).expects("noError");
        });

        afterEach("getProfiles", () => {
            sandbox.restore();
        });

        it("should fetch the friends list", (done) => {
            nodeErrorHandlerMock.returns(true);
            let url = `/v2.8/me/taggable_friends?fields=id,name,picture&limit=100&access_token=${accessToken}&appsecret_proof=${appSecretProof}`;
            nock("https://graph.facebook.com")
                .get(url)
                .reply(HttpResponseHandler.codes.OK, {
                    "data": [{
                        "id": "7dsEdsA8",
                        "name": "Maha Arjun",
                        "picture": {
                            "data": {
                                "is_silhouette": false,
                                "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/c0.19.50.50/p50x50/14595563172_n.jpg"
                            }
                        }
                    },
                    { "id": "yrmFdKCsh1m",
                        "name": "Murali Krishna",
                        "picture": {
                            "data": {
                                "is_silhouette": false,
                                "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/14591830_n.jpg"
                            }
                        }
                    }]
                });

            let facebookClient = new FacebookClient(accessToken, appSecretProof);
            facebookClient.fetchProfiles().then((profiles) => {
                try {
                    expect(profiles.data).to.have.lengthOf(2);
                    expect(profiles.data[0].name).to.equal("Maha Arjun");
                    expect(profiles.data[1].name).to.equal("Murali Krishna");
                    done();
                } catch(error) {
                    done(error);
                }
            });
        });

        it("should reject the promise if there are any errors from facebook like authentication", (done) => {
            nodeErrorHandlerMock.returns(true);
            let url = `/v2.8/me/taggable_friends?fields=id,name,picture&limit=100&access_token=${accessToken}&appsecret_proof=${appSecretProof}`;

            nock("https://graph.facebook.com")
                .get(url)
                .reply(HttpResponseHandler.codes.BAD_REQUEST, {
                    "error": {
                        "message": "Error validating access token: Session has expired on Thursday, 10-Dec-15 04:00:00 PST. The current time is Thursday, 10-Dec-15 20:23:54 PST.",
                        "type": "OAuthException",
                        "code": 190,
                        "error_subcode": 463,
                        "fbtrace_id": "AWpk5h2ceG6"
                    }
                });

            let facebookClient = new FacebookClient(accessToken, appSecretProof);
            facebookClient.fetchProfiles().catch((error) => {
                try {
                    assert.strictEqual("OAuthException", error.type);
                    assert.strictEqual("Error validating access token: Session has expired on Thursday, 10-Dec-15 04:00:00 PST. The current time is Thursday, 10-Dec-15 20:23:54 PST.", error.message);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
    });

    describe("getSourceUrls", () => {
        let facebookClient = null;

        beforeEach("getSourceUrls", () => {
            facebookClient = FacebookClient.instance(accessToken, appSecretProof);
        });

        it("should give an error when facebook is rejected with some error", (done) => {
            let params = {
                "q": "keyword",
                "type": "user"
            };

            let paging = {
                "__after_id": "enc_AdClDCor0",
                "limit": "25",
                "offset": "25"
            };

            nock("https://graph.facebook.com")
                .get(`/v2.8/search?q=${params.q}&type=user&fields=id,name,picture&__after_id=${paging.__after_id}&limit=${paging.limit}&offset=${paging.offset}&access_token=test_token&appsecret_proof=test_secret_proof`)
                .reply(HttpResponseHandler.codes.BAD_REQUEST, {
                    "error": { "message": "Invalid OAuth access token.",
                        "type": "OAuthException",
                        "code": 190
                    } }
                );

            facebookClient.fetchSourceUrls(params, paging).catch(error => {
                try {
                    assert.strictEqual("OAuthException", error.type);
                    assert.strictEqual("Invalid OAuth access token.", error.message);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it("should fetch the facebook pages", (done) => {
            let pages = { "data": [
                    { "name": "The Hindu", "id": "163974433696568" },
                    { "name": "The Hindu Business Line", "id": "60573550946" },
                    { "name": "The Hindu Temple of Canton", "id": "148163135208246" }] };

            let params = {
                "q": "keyword",
                "type": "user"
            };

            let paging = {
                "__after_id": "enc_AdClDCor0",
                "limit": "25",
                "offset": "25"
            };

            nock("https://graph.facebook.com")
                .get(`/v2.8/search?q=${params.q}&type=user&fields=id,name,picture&__after_id=${paging.__after_id}&limit=${paging.limit}&offset=${paging.offset}&access_token=test_token&appsecret_proof=test_secret_proof`)
                .reply(HttpResponseHandler.codes.OK, pages);

            facebookClient.fetchSourceUrls(params, paging).then(data => {
                try {
                    expect(data).to.deep.equal(pages);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
    });
});
