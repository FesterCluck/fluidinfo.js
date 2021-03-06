/**
 * Some BDD style tests. The point is that reading these should be like
 * reading some sort of specification for the application being tested.
 */

/**
 * Describes the behaviour expected of a standard AJAX request from the library.
 */
function it_should_be_a_standard_ajax_request() {

  it("should send one request", function() {
    expect(this.server.requests.length)
      .toEqual(1);
  });

  it("should point to the correct domain", function() {
    expect(this.server.requests[0].url)
      .toContain(this.fi.baseURL);
  });
};

/**
 * Ensures that the latest request contained no payload.
 */
function it_should_have_an_empty_payload () {
  it("should have an empty payload", function() {
    expect(this.server.requests[0]["data"])
      .toEqual(null);
  });
}

/**
 * Ensures that the last request was appropriately authenticated.
 */
function it_should_be_authenticated() {
  it("should be an authorized request", function() {
    expect(this.server.requests[0].requestHeaders['Authorization'])
      .not.toEqual(undefined);
  });
}

/**
 * Ensures that the last request had the correct content-type sent
 *
 * @param type {String} the expected value of the Content-Type
 */
function it_should_have_a_content_type_of(type) {
  it("should have the content-type: "+type, function() {
    expect(this.server.requests[0].requestHeaders['Content-Type'])
      .toContain(type); // toContain avoids regex
  });
}

/**
 * Encapsulates tests that describe the expected behaviour of the Fluidinfo
 * library.
 */
describe("Fluidinfo.js", function() {

  beforeEach(function() {
    this.server = sinon.fakeServer.create();
    this.xhr = sinon.useFakeXMLHttpRequest();
    this.fi = fluidinfo({ username: "username", password: "password"});
  });

  /**
   * Describes the expected behaviour of a new Fluidinfo session object.
   */
  describe("Configuration", function() {
    it("should default to point to the main instance", function() {
      expect(this.fi.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
    });

    it("should set the lib to point to the main instance", function() {
      var fi = fluidinfo({ username: "username",
                           password: "password",
                           instance: "main"
                         });
      expect(fi.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
    });

    it("should set the lib to point to the sandbox", function() {
      var fi = fluidinfo({ username: "username",
                           password: "password",
                           instance: "sandbox"
                         });
      expect(fi.baseURL).toEqual("https://sandbox.fluidinfo.com/");
    });

    it("should set the lib to point to any other instance", function() {
      var fi = fluidinfo({instance: "https://localhost/"});
      expect(fi.baseURL).toEqual("https://localhost/");
    });

    it("should validate bespoke instances are valid addresses", function() {
      // missing http[s]:// and trailing slash
      try {
        var fi = fluidinfo({instance: "localhost"});
      } catch(e) {
        var exception = e;
      }
      expect(exception.name).toEqual("ValueError");
      // missing the trailing slash
      try {
        var fi = fluidinfo({instance: "http://localhost"});
      } catch(e) {
        var exception = e;
      }
      expect(exception.name).toEqual("ValueError");
      // missing http[s]://
      try {
        var fi = fluidinfo({instance: "localhost/"});
      } catch(e) {
        var exception = e;
      }
      expect(exception.name).toEqual("ValueError");
      // valid case
      var fi = fluidinfo({instance: "https://localhost/"});
      expect(fi.baseURL).toEqual("https://localhost/");
    });

    it("should work as a logged in user", function() {
      this.fi.api.get({path: "users/ntoll"})
      expect(this.server.requests[0].requestHeaders['Authorization'])
            .not.toEqual(undefined);
      expect(this.fi.username).toEqual("username");
    });

    it("should work as anonymous user", function() {
      var fi = fluidinfo();
      expect(fi.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
      fi.api.get({path: "users/ntoll"})
      expect(this.server.requests[0].requestHeaders['Authorization'])
            .toEqual(undefined);
      expect(fi.username).toEqual(undefined);
    });
  });

  /**
   * Describes the behaviour of functions that allow direct reference to
   * REST API endpoints.
   */
  describe("API", function() {

    describe("Request configuration", function() {
      it("should correctly use the full URL", function() {
        var options = new Object();
        options.path = "objects/fakeObjectID/username/tag";
        this.fi.api.get(options);
        var expected = "https://fluiddb.fluidinfo.com/objects/fakeObjectID/username/tag";
        var actual = this.server.requests[0].url;
        expect(actual).toEqual(expected);
      });

      it("should correctly process URL arguments", function() {
        var options = new Object();
        options.path = "values";
        options.args = {tag: ["foo/bar", "baz/qux"],
          query: "has ntoll/rating > 7"};
        this.fi.api.get(options);
        expected = "https://fluiddb.fluidinfo.com/values?tag=foo%2Fbar&tag=baz%2Fqux&query=has%20ntoll%2Frating%20%3E%207";
        actual = this.server.requests[0].url;
        expect(actual).toEqual(expected);
      });

      it("should correctly set content-type on a primitive value PUT to the /objects endpoint", function() {
        var options = new Object();
        options.path = "objects/fakeObjectID/username/tag";
        options.data = 1.234;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should correctly set content-type on a primitive value PUT to the /about endpoint", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = 1.234;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should correctly set content-type on a passed in MIME as PUT to the /objects endpoint", function() {
        var options = new Object();
        options.path = "objects/fakeObjectID/username/tag";
        options.data = "<html><body><h1>Hello, world!</h1></body></html>";
        options.contentType = "text/html";
        this.fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should correctly set content-type on a passed in MIME as PUT to the /about endpoint", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = "<html><body><h1>Hello, world!</h1></body></html>";
        options.contentType = "text/html";
        this.fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should complain if it can't set a content-type on a PUT to /objects", function() {
        var options = new Object();
        options.path = "objects/fakeObjectID/username/tag";
        options.data = {"foo": "bar"};
        try {
          this.fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should complain if it can't set a content-type on a PUT to /about", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = {"foo": "bar"};
        try {
          this.fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should set the content-type to to 'application/json' by default", function() {
        var options = new Object();
        options.path = "namespaces/test";
        options.data = {name: "foo", description: "bar"};
        this.fi.api.post(options);
        expected = "application/json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should appropriately encode a URL passed as an array", function() {
        var options = new Object();
        options.path = ["about", "än/- object", "namespace", "tag"];
        options.data = {name: "foo", description: "bar"};
        this.fi.api.post(options);
        expect(this.server.requests[0].url)
          .toEqual(this.fi.baseURL+"about/%C3%A4n%2F-%20object/namespace/tag");
      })
    });

    describe("Response handling", function() {
      it("should parse the response headers correctly", function() {
        var HEADERS = ["Content-Type", "Content-Length", "Location", "Date",
          "WWW-Authenticate", "Cache-Control", "X-FluidDB-Error-Class",
          "X-FluidDB-Path", "X-FluidDB-Message", "X-FluidDB-ObjectId",
          "X-FluidDB-Query", "X-FluidDB-Name", "X-FluidDB-Category",
          "X-FluidDB-Action", "X-FluidDB-Rangetype", "X-FluidDB-Fieldname",
          "X-FluidDB-Type", "X-FluidDB-Argument"];
        var options = new Object();
        options.path = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        var spy = sinon.spy();
        options.onSuccess = function(result) {
          var h = "";
          for(h in HEADERS){
            var header = HEADERS[h];
            expect(result.headers[header]).toEqual("foo");
          }
          spy();
        };
        this.fi.api.post(options);
        var responseStatus = 201;
        var responseHeaders = new Object();
        var h = "";
        for(h in HEADERS){
          var header = HEADERS[h];
          responseHeaders[header] = "foo";
        }
        var responseText = '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/test/foo"}';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should provide a simple response object for onSuccess", function() {
        var options = new Object();
        options.path = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        var spy = sinon.spy();
        options.onSuccess = function(result) {
          expect(typeof(result)).toEqual("object");
          expect(result.status).toEqual(201);
          expect(result.statusText).toEqual("Created");
          expect(typeof(result.headers)).toEqual("object");
          expect(result.headers["Content-Type"]).toEqual("application/json");
          expect(result.data).toBeTruthy();
          expect(typeof(result.rawData)).toEqual("string");
          expect(typeof(result.request)).toEqual("object"); // original XHR
          spy();
        };
        this.fi.api.post(options);
        var responseStatus = 201;
        var responseHeaders = {"Content-Type": "application/json",
          "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
          "Content-Length": 107,
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/test/foo"}';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should provide a simple response object for onError", function() {
        var options = new Object();
        options.path = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        var spy = sinon.spy();
        options.onError = function(result) {
          expect(typeof(result)).toEqual("object");
          expect(result.status).toEqual(401);
          expect(result.statusText).toEqual("Unauthorized");
          expect(typeof(result.headers)).toEqual("object");
          expect(result.data).toEqual("");
          expect(result.rawData).toEqual("");
          expect(typeof(result.request)).toEqual("object"); // original XHR
          spy(); // to prove the function was called
        };
        this.fi.api.post(options);
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
          "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should return a simple response object for onSuccess when async=False", function() {
        var options = new Object();
        options.path = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        options.async = false;
        var responseStatus = 201;
        var responseHeaders = {"Content-Type": "application/json",
          "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
          "Content-Length": 107,
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/test/foo"}';
        this.server.respondWith([responseStatus, responseHeaders, responseText]);
        var result = this.fi.api.post(options);
        expect(typeof(result)).toEqual("object");
        expect(result.status).toEqual(201);
        expect(result.statusText).toEqual("Created");
        expect(typeof(result.headers)).toEqual("object");
        expect(result.headers["Content-Type"]).toEqual("application/json");
        expect(result.data).toBeTruthy();
        expect(typeof(result.rawData)).toEqual("string");
        expect(typeof(result.request)).toEqual("object"); // original XHR
      });

      it("should serialise Javascript objects into JSON", function() {
        var options = new Object();
        options.path = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        this.fi.api.post(options);
        expected = "application/json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
        expect(this.server.requests[0].requestBody)
          .toEqual(JSON.stringify(payload));
      })

      it("should de-serialise JSON payloads to Javascript objects", function() {
        var options = new Object();
        options.path = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        options.onSuccess = function(result) {
            expect(result.data.id)
              .toEqual("e9c97fa8-05ed-4905-9f72-8d00b7390f9b");
        };
        this.fi.api.post(options);
        this.server.requests[0].respond(201, {"Content-Type": "application/json"}, '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/foo/bar"}');
      })
    });

    describe("GET", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.server.respondWith("GET", "https://fluiddb.fluidinfo.com/objects/fakeObjectID/username/tag",
            [200, {"Content-Type": "application/vnd.fluiddb.value+json"},
            "1.234"]);
          this.fi.api.get({
                 path: "objects/fakeObjectID/username/tag",
                 onSuccess: function(result) {
                   expect(result.data).toEqual(1.234);
                 },
                 onError: function(result) {
                   throw { name: "XHRError", message: "Bad response"};
                 }
          });
          this.server.respond()
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a GET method", function() {
          expect(this.server.requests[0].method)
            .toEqual("GET");
        });

        it_should_have_an_empty_payload();
      });
    });

    describe("POST", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.fi.api.post({
                 path: "namespaces/test",
                 data: {name: "test", description: "A description"},
                 onSuccess: function(result){
                   expect(result.status).toEqual(201);
                   expect(result.data.id).
                     toEqual("e9c97fa8-05ed-4905-9f72-8d00b7390f9b");
                 }
          });
          var responseStatus = 201;
          var responseHeaders = {"Content-Type": "application/json",
              "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
              "Content-Length": 107,
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/test/foo"}';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a POST method", function() {
          expect(this.server.requests[0].method)
            .toEqual("POST");
        });

        it("should have a payload", function() {
          expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
          expect(this.server.requests[0].requestBody)
            .toBeTruthy();
        });

        it_should_have_a_content_type_of("application/json");
      });
    });

    describe("PUT", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.fi.api.put({
                 path: "objects/fakeObjectID/username/tag",
                 data: "data",
                 onSuccess: function(result){
                   expect(result.status).toEqual(204);
                 },
          });
          var responseStatus = 204;
          var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a PUT method", function() {
          expect(this.server.requests[0].method)
            .toEqual("PUT");
        });

        it("should have a payload", function() {
          expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
          expect(this.server.requests[0].requestBody)
            .toEqual('"data"');
        });

        it_should_have_a_content_type_of("application/vnd.fluiddb.value+json");
      });
    });

    describe("DELETE", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.fi.api.delete({
                 path: "objects/fakeObjectID/username/tag",
                 onSuccess: function(result){
                   expect(result.status).toEqual(204);
                 }
          });
          var responseStatus = 204;
          var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a DELETE method", function() {
          expect(this.server.requests[0].method)
            .toEqual("DELETE");
        });

        it_should_have_an_empty_payload();

      })
    });

    describe("HEAD", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.fi.api.head({
                 path: "objects/fakeObjectID/username/tag",
                 onSuccess: function(response){
                   expect(response.status).toEqual(200);
                   expect(response.statusText).toEqual("OK");
                   expect(typeof(response.headers)).toEqual("object");
                   expect(response.headers["Content-Type"]).toEqual("text/html");
                   expect(response.headers["Content-Length"]).toEqual("28926");
                   expect(response.headers["Date"]).toEqual("Mon, 02 Aug 2010 12:40:41 GMT");
                 }
          });
          var responseStatus = 200;
          var responseHeaders = {"Content-Type": "text/html",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a HEAD method", function() {
          expect(this.server.requests[0].method)
            .toEqual("HEAD");
        });

        it_should_have_an_empty_payload();
      });
    });
  });

  /**
   * Describes the behaviour of utility functions used when making calls to the
   * API.
   */
  describe("API utilities", function(){

    /**
     * Checks the library correctly detects the appropriate MIME type to set for
     * the eventual value of the Content-Type header of a request.
     */
    describe("Content-Type detection", function() {
      it("should identify a primitive in a PUT to 'objects'", function() {
        var options = new Object();
        options.path = "objects/fakeObjectID/username/tag";
        options.data = 1.234;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a primitive in a PUT to 'about'", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = 1.234;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a given MIME in a PUT to 'objects'", function() {
        var options = new Object();
        options.path = "objects/fakeObjectID/username/tag";
        options.contentType = "text/html";
        this.fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a given MIME in a PUT to 'about'", function() {
        var options = new Object();
        options.type = "PUT";
        options.path = "about/fakeAboutValue/username/tag";
        options.contentType = "text/html";
        this.fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should default to JSON for all other requests with data", function() {
        var options = new Object();
        options.path = "namespaces/test";
        options.data = {name: "foo", description: "bar"};
        this.fi.api.post(options);
        expected = "application/json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should complain if it can't detect the MIME", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = new Object();
        try {
          this.fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });
    });

    /**
     * Checks the library correctly identies primitive values.
     */
    describe("Primitive identification", function() {
      it("should identify an integer as primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = 1;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a float as primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = 1.234;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a boolean as primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = false;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a string as primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = "hello";
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a null as primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = null;
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a string array as primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = ["a", "b", "c"];
        this.fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a mixed array as NOT primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = ["a", "b", 1];
        try {
          this.fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should identify an object as NOT primitive", function() {
        var options = new Object();
        options.path = "about/fakeAboutValue/username/tag";
        options.data = {foo: "bar"};
        try {
          this.fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });
    });
  });

  /**
   * Checks the library correctly implements the various utility functions for
   * common tasks.
   */
  describe("Utility functions", function() {
    /**
     * See semi-specification described here:
     * https://github.com/fluidinfo/fluidinfo.js/issues/9#issuecomment-1700115
     */
    describe("Query function", function() {

      beforeEach(function() {
        this.responseText = JSON.stringify({
          results: {id: {
            "05eee31e-fbd1-43cc-9500-0469707a9bc3": {
                "fluiddb/about": {
                  "value": "foo"
                },
                "ntoll/foo": {
                  "value": 5
                },
                "terrycojones/bar": {
                  "value-type": "image/png",
                  "size": 179393
                }
            }
          }}
        });
      });

      it("should send an appropriate query to /values", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var where = "has esteve/rating > 7";
        this.fi.query({select: select, where: where, onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values?tag=ntoll%2Ffoo&tag=terrycojones%2Fbar&tag=fluiddb%2Fabout&query=has%20esteve%2Frating%20%3E%207";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("GET");
      });

      it("should insist on a 'select' argument", function() {
        try {
          var where = "has esteve/rating>7";
          this.fi.query({where: where, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should insist on a 'where' argument", function() {
        try {
          var select = ["ntoll/foo", "terrycojones/bar"];
          this.fi.query({select: select, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should appropriately call onSuccess function", function() {
        var select = ["ntoll/foo", "terrycojones/bar"];
        var where = "has esteve/rating>7";
        var onSuccess = sinon.mock();
        this.fi.query({select: select, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        // expect the onSuccess function to be called only once
        expect(onSuccess.once()).toBeTruthy();
      });

      it("should appropriately call onError function", function() {
        var select = ["ntoll/foo", "terrycojones/bar"];
        var where = "has esteve/rating>7";
        var onError = sinon.mock();
        this.fi.query({select: select, where: where, onSuccess: function(result){},
          onError: onError});
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        // expect the onError function to be called only once
        expect(onError.once()).toBeTruthy();
      });

      it("should build a result array correctly", function() {
        var select = ["ntoll/foo", "terrycojones/bar"];
        var where = "has esteve/rating>7";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(Object.prototype.toString.apply(result.data))
            .toEqual("[object Array]");
          spy();
        };
        this.fi.query({select: select, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce objects with id and original result in rawData", function() {
        var select = ["ntoll/foo", "terrycojones/bar"];
        var where = "has esteve/rating>7";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data[0];
          expect(obj.id).toEqual("05eee31e-fbd1-43cc-9500-0469707a9bc3");
          expect(typeof(result.rawData)).toEqual("string");
          spy();
        };
        this.fi.query({select: select, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce objects where values can be referenced by tag path", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var where = "has esteve/rating>7";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data[0];
          expect(obj["fluiddb/about"]).toEqual("foo");
          expect(obj["ntoll/foo"]).toEqual(5);
          spy();
        };
        this.fi.query({select: select, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce objects that correctly represent opaque values", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var where = "has esteve/rating>7";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data[0];
          expect(typeof(obj["terrycojones/bar"])).toEqual("object");
          expect(obj["terrycojones/bar"]["value-type"]).toEqual("image/png");
          expect(obj["terrycojones/bar"]["size"]).toEqual(179393);
          var expected = "https://fluiddb.fluidinfo.com/objects/05eee31e-fbd1-43cc-9500-0469707a9bc3/terrycojones/bar";
          expect(obj["terrycojones/bar"]["url"]).toEqual(expected);
          spy();
        };
        this.fi.query({select: select, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });
    });

    /**
     * See semi-specification described here:
     * https://github.com/fluidinfo/fluidinfo.js/issues/10
     */
    describe("Update function", function() {
      it("should insist on a values object", function() {
        try {
          var where = "has esteve/rating>7";
          this.fi.update({where: where, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should insist on a where object", function() {
        try {
          var vals = {"foo/bar": "baz"};
          this.fi.update({values: vals, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should produce the correct JSON payload", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var where = "has terrycojones < 2";
        this.fi.update({values: vals, where: where, onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("PUT");
        expect(this.server.requests[0].requestHeaders["Content-Type"])
          .toContain("application/json");
        expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
        var body = JSON.parse(this.server.requests[0].requestBody);
        expect(Object.prototype.toString.apply(body.queries))
            .toEqual("[object Array]");
        var updateSpecification = body.queries[0];
        expect(updateSpecification[0]).toEqual(where);
        expect(updateSpecification[1]["ntoll/rating"].value).toEqual(7);
        expect(updateSpecification[1]["ntoll/description"].value).toEqual("I like it!");
      });

      it("should call onSuccess appropriately", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var where = "has terrycojones < 2";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(result.status).toEqual(204);
          spy();
        };
        this.fi.update({values: vals, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 204;
        var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '');
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should call onError when a problem occurs", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var where = "has terrycojones < 2";
        var spy = sinon.spy();
        var onError = function(result) {
          expect(result.status).toEqual(401);
          spy();
        };
        this.fi.update({values: vals, where: where, onSuccess: function(result){},
          onError: onError});
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '');
        expect(spy.calledOnce).toBeTruthy();
      });
    });

    /**
     * See semi-specification described here:
     * https://github.com/fluidinfo/fluidinfo.js/issues/11
     */
    describe("Tag function", function() {
      it("should insist on a values attribute in options", function() {
        try {
          var about = "foo";
          this.fi.tag({about: about, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should insist on either an id or about attribute in options", function() {
        try {
          var values = {
            "ntoll/rating": 7,
            "ntoll/comment": "I like it!"
          };
          this.fi.tag({values: values, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should send the correct JSON payload using fluiddb/about", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var about = "foo";
        this.fi.tag({values: vals, about: about, onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("PUT");
        expect(this.server.requests[0].requestHeaders["Content-Type"])
          .toContain("application/json");
        expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
        var body = JSON.parse(this.server.requests[0].requestBody);
        expect(Object.prototype.toString.apply(body.queries))
            .toEqual("[object Array]");
        var updateSpecification = body.queries[0];
        expect(updateSpecification[0]).toEqual('fluiddb/about="foo"');
        expect(updateSpecification[1]["ntoll/rating"].value).toEqual(7);
        expect(updateSpecification[1]["ntoll/description"].value).toEqual("I like it!");
      });

      it("should send the correct JSON payload using fluiddb/id", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var id = "SOMEUUID";
        this.fi.tag({values: vals, id: id, onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("PUT");
        expect(this.server.requests[0].requestHeaders["Content-Type"])
          .toContain("application/json");
        expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
        var body = JSON.parse(this.server.requests[0].requestBody);
        expect(Object.prototype.toString.apply(body.queries))
            .toEqual("[object Array]");
        var updateSpecification = body.queries[0];
        expect(updateSpecification[0]).toEqual('fluiddb/id="SOMEUUID"');
        expect(updateSpecification[1]["ntoll/rating"].value).toEqual(7);
        expect(updateSpecification[1]["ntoll/description"].value).toEqual("I like it!");
      });

      it("should call onSuccess as appropriate", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var about = "foo";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(result.status).toEqual(204);
          spy();
        };
        this.fi.tag({values: vals, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 204;
        var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '');
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should call onError as appropriate", function() {
        var vals = {
          "ntoll/rating": 7,
          "ntoll/description": "I like it!"
        };
        var about = "foo";
        var spy = sinon.spy();
        var onError= function(result) {
          expect(result.status).toEqual(401);
          spy();
        };
        this.fi.tag({values: vals, about: about, onSuccess: function(){},
          onError: onError});
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '');
        expect(spy.calledOnce).toBeTruthy();
      });
    });

    /**
     * See semi-specification described here:
     * https://github.com/fluidinfo/fluidinfo.js/issues/29
     */
    describe("Delete function", function() {
      it("should produce the correct request to Fluidinfo", function(){
        var tags = ["ntoll/rating", "ntoll/description"];
        var where = "terrycojones/rating < 2";
        this.fi.delete({tags: tags, where: where,
          onSuccess: function(result){}, onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values?tag=ntoll%2Frating&tag=ntoll%2Fdescription&query=terrycojones%2Frating%20%3C%202";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("DELETE");
      });

      it("should insist on a tags attribute in options", function() {
        try {
          var where = "terrycojones/rating < 2";
          this.fi.delete({where: where, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should insist on a where object", function() {
        try {
          var tags = ["ntoll/rating", "ntoll/description"];
          this.fi.delete({tags: tags, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should call onSuccess as appropriate", function() {
        var tags = ["ntoll/rating", "ntoll/description"];
        var where = "terrycojones/rating < 2";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(result.status).toEqual(204);
          spy();
        };
        this.fi.delete({tags: tags, where: where, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 204;
        var responseHeaders = {"Content-Type": "text/html",
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '');
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should call onError as appropriate", function() {
        var tags = ["ntoll/rating", "ntoll/description"];
        var where = "terrycojones/rating < 2";
        var spy = sinon.spy();
        var onError= function(result) {
          expect(result.status).toEqual(401);
          spy();
        };
        var onSuccess = function() {};
        this.fi.delete({tags: tags, where: where, onSuccess: onSuccess,
          onError: onError});
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '');
        expect(spy.calledOnce).toBeTruthy();
      });
    });

    /**
     * See semi-specification described here:
     * https://github.com/fluidinfo/fluidinfo.js/issues/12
     */
    describe("getObject function", function() {
      beforeEach(function() {
        this.responseText = JSON.stringify({
          results: {id: {
            "05eee31e-fbd1-43cc-9500-0469707a9bc3": {
                "fluiddb/about": {
                  "value": "foo"
                },
                "ntoll/foo": {
                  "value": 5
                },
                "terrycojones/bar": {
                  "value-type": "image/png",
                  "size": 179393,
                }
            }
          }}
        });
      });

      it("should insist on a select value", function() {
        try {
          var about = "foo";
          this.fi.getObject({about: about, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should insist on either an id or about attribute in options", function() {
        try {
          var select = ["fluiddb/about", "ntoll/foo", "terrycojones/bar"];
          this.fi.getObject({select: select, onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should result in the correct request to Fluidinfo for 'about'", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "foo";
        this.fi.getObject({select: select, about: about, onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values?tag=ntoll%2Ffoo&tag=terrycojones%2Fbar&tag=fluiddb%2Fabout&query=fluiddb%2Fabout%3D%22foo%22";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("GET");
      });

      it("should result in the correct request to Fluidinfo for 'id'", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var id = "SOMEUUID";
        this.fi.getObject({select: select, id: id, onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/values?tag=ntoll%2Ffoo&tag=terrycojones%2Fbar&tag=fluiddb%2Fabout&query=fluiddb%2Fid%3D%22SOMEUUID%22";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("GET");
      });

      it("should result in a single appropriate JS object", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "foo";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(typeof (result.data))
            .toEqual("object");
          spy();
        };
        this.fi.getObject({select: select, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce an object with id and original result in rawData", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "foo";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data;
          expect(obj.id).toEqual("05eee31e-fbd1-43cc-9500-0469707a9bc3");
          expect(typeof(result.rawData)).toEqual("string");
          spy();
        };
        this.fi.getObject({select: select, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce an object where values can be referenced by tag path", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "foo";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data;
          expect(obj["fluiddb/about"]).toEqual("foo");
          expect(obj["ntoll/foo"]).toEqual(5);
          spy();
        };
        this.fi.getObject({select: select, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce an object that correctly represents opaque values", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "about";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data;
          expect(typeof(obj["terrycojones/bar"])).toEqual("object");
          expect(obj["terrycojones/bar"]["value-type"]).toEqual("image/png");
          expect(obj["terrycojones/bar"]["size"]).toEqual(179393);
          var expected = "https://fluiddb.fluidinfo.com/objects/05eee31e-fbd1-43cc-9500-0469707a9bc3/terrycojones/bar";
          expect(obj["terrycojones/bar"]["url"]).toEqual(expected);
          spy();
        };
        this.fi.getObject({select: select, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should produce and *empty* object when no result is returned", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "about";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          var obj = result.data;
          expect(typeof(obj)).toEqual("object");
          expect(obj.id).toEqual(undefined); 
          spy();
        };
        this.fi.getObject({select: select, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, '{"results": {"id": {}}}');
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should appropriately call the onSuccess function", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "about";
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(result.status).toEqual(200);
          spy();
        };
        this.fi.getObject({select: select, about: about, onSuccess: onSuccess,
          onError: function(result){}});
        var responseStatus = 200;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should appropriately call the onError function", function() {
        var select = ["ntoll/foo", "terrycojones/bar", "fluiddb/about"];
        var about = "about";
        var spy = sinon.spy();
        var onError= function(result) {
          expect(result.status).toEqual(401);
          spy();
        };
        this.fi.getObject({select: select, about: about,
          onSuccess: function(result){}, onError: onError});
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, this.responseText);
        expect(spy.calledOnce).toBeTruthy();
      });
    });

    /**
     * See semi-specification described here:
     * https://github.com/fluidinfo/fluidinfo.js/issues/37
     */
    describe("createObject function", function() {
      it("should complain if the user isn't logged in", function() {
        var fi = fluidinfo(); // anonymous user
        try{
          fi.createObject({about: "foo", onSuccess: function(result){},
            onError: function(result){}});
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("AuthorizationError");
      });

      it("should send the correct request to Fluidinfo with an about value", function() {
        this.fi.createObject({about: "foo", onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/about/foo";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("POST");
      });

      it("should send the correct request to Fluidinfo as an anonymous object", function() {
        this.fi.createObject({onSuccess: function(result){},
          onError: function(result){}});
        expected = "https://fluiddb.fluidinfo.com/objects";
        expect(this.server.requests[0].url).toEqual(expected);
        expect(this.server.requests[0].method).toEqual("POST");
      });

      it("should return an object with 'id' and 'fluiddb/about' attributes", function() {
        var onSuccess = function(result) {
          var obj = result.data;
          expect(typeof(obj)).toEqual("object");
          expect(result.status).toEqual(201);
          expect(obj.id).toEqual("12345");
          expect(obj["fluiddb/about"]).toEqual("foo");
        };
        this.fi.createObject({about: "foo", onSuccess: onSuccess,
          onError: function(result) {}});
        var responseStatus = 201;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Location": "http://fluiddb.fluidinfo.com/about/foo",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '{"id": "12345", "URI": "http://fluiddb.fluidinfo.com/about/foo"}';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
      });

      it("should return an object with just an 'id' attribute for an anonymous object", function() {
        var onSuccess = function(result) {
          var obj = result.data;
          expect(typeof(obj)).toEqual("object");
          expect(result.status).toEqual(201);
          expect(obj.id).toEqual("12345");
          expect(obj["fluiddb/about"]).toEqual(undefined);
        };
        this.fi.createObject({onSuccess: onSuccess,
          onError: function(result) {}});
        var responseStatus = 201;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Location": "http://fluiddb.fluidinfo.com/objects/12345",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '{"id": "12345", "URI": "http://fluiddb.fluidinfo.com/objects/12345"}';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
      });

      it("should appropriately call onSuccess", function() {
        var spy = sinon.spy();
        var onSuccess = function(result) {
          expect(result.status).toEqual(201);
          spy();
        };
        this.fi.createObject({about: "foo", onSuccess: onSuccess,
          onError: function(result) {}});
        var responseStatus = 201;
        var responseHeaders = {"Content-Type": "application/json",
              "Content-Length": "28926",
              "Location": "http://fluiddb.fluidinfo.com/about/foo",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '{"id": "12345", "URI": "http://fluiddb.fluidinfo.com/about/foo"}';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        expect(spy.calledOnce).toBeTruthy();
      });

      it("should appropriately call onError", function() {
        var spy = sinon.spy();
        var onError = function(result) {
          expect(result.status).toEqual(401);
          spy();
        };
        this.fi.createObject({about: "foo", onSuccess: function(result){},
          onError: onError});
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        this.server.requests[0].respond(responseStatus, responseHeaders, "");
        expect(spy.calledOnce).toBeTruthy();
      });
    });
  });

  afterEach(function() {
    this.server.restore();
  });
});
