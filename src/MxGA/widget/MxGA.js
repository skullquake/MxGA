define(
	[
		"dojo/_base/declare",
		"mxui/widget/_WidgetBase",
		"dijit/_TemplatedMixin",
		"mxui/dom",
		"dojo/dom",
		"dojo/dom-prop",
		"dojo/dom-geometry",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/dom-construct",
		"dojo/_base/array",
		"dojo/_base/lang",
		"dojo/text",
		"dojo/html",
		"dojo/_base/event",
		"MxGA/lib/jquery-1.11.2",
		"dojo/text!MxGA/widget/template/MxGA.html"
	],
	function(
		declare,
		_WidgetBase,
		_TemplatedMixin,
		dom,
		dojoDom,
		dojoProp,
		dojoGeometry,
		dojoClass,
		dojoStyle,
		dojoConstruct,
		dojoArray,
		lang,
		dojoText,
		dojoHtml,
		dojoEvent,
		_jQuery,
		widgetTemplate
	){
		"use strict";
		var $ = _jQuery.noConflict(true);
		return declare(
			"MxGA.widget.MxGA",
			[
				_WidgetBase,
				_TemplatedMixin
			],
			{
				templateString: widgetTemplate,
				widgetBase: null,
				// Internal variables.
				_handles: null,
				_contextObj: null,
				_initialized: false,
				prefix: "",
				constructor: function () {
					this._handles = [];
				},
				postCreate: function () {
					if(this.attr_uacode==null)this.attr_uacode="UACode";
					logger.debug(this.id + ".postCreate");
				},
				postCreate: function () {
				},
				update: function (obj, callback) {
					logger.debug(this.id + ".update");
					this._contextObj = obj;
					if(
						this._contextObj!=null&&
						this.attr_uacode!=null&&
						this._contextObj.get(this.attr_uacode)!=null
					){
						if (!this._initialized) {
						if (typeof window.MXGA === "undefined") {
							this._insertGoogleAnalytics();
						}
						this._setupGlobalTrackerId();
						this.connect(this.mxform, "onNavigation", function() {
							if(this.trackIt) {
								this._addPage();
							}
						});
						this._initialized = true;
						}
					}
					callback();
				},
				_setupGlobalTrackerId: function () {
					logger.debug(this.id + "._setupGlobalTrackerId");
					//window.MXGA = {trackerId: this.uaTrackCode};
					window.MXGA = {trackerId: this._contextObj.get(this.attr_uacode)};//changed
				},
				_replaceTagsRecursive:function(s,attrs,callback){
					logger.debug(this.id+"._replaceTagsRecursive");
					var attr=attrs.pop();
					if (attr===undefined) {
						lang.hitch(this, callback(s));
					} else {
						var toBeReplacedValue = "${" + attr.variableName + "}";
						this._contextObj.fetch(attr.attr, lang.hitch(this, function (value) {
								var str = s.replace(toBeReplacedValue, value);
								lang.hitch(this, this._replaceTagsRecursive(str, attrs, callback));
							})
						);
					}
				},

				_replaceTags: function (s, callback) {
					logger.debug(this.id + "._replaceTags");
					this._replaceTagsRecursive(s, this.attributeList.slice(), function (str) {
						callback(str);
					});
				},

				_insertGoogleAnalytics: function () {
					logger.debug(this.id + "._insertGoogleAnalytics");
					this._addGoogle(window, document, "script", "//www.google-analytics.com/analytics.js", "ga");

					if (typeof window.MXGA === "undefined") {
						//this._replaceTags(this.uaTrackCode, lang.hitch(this, function (text) {
						this._replaceTags(this._contextObj.get(this.attr_uacode), lang.hitch(this, function (text) {
							var opts = { "cookieDomain": "auto" };

							if (this.useridAttr !== "") {
								var uid = this._contextObj.get(this.useridAttr);
								opts.userId = uid;
								ga("create", text, opts);
								ga("set", "&uid", uid);

								if (this.userIdDimension > 0)
									ga("set", "dimension"+this.userIdDimension, uid);

							} else {
								ga("create", text, opts);
							}

						}));
					}
				},
				_buildFullPath: function(prefix, includePageName, oriMendixPath) {
				  if (includePageName) {
					var pageExtension = ".page.xml";
					var path = oriMendixPath.substr(0, oriMendixPath.length - pageExtension.length);
					return prefix + "/" + path;
				  } else {
					return prefix;
				  }
				},
				_addPage: function () {
					logger.debug(this.id + "._addPage");
					this._replaceTags(this.prefix, lang.hitch(this, function(text) {
						var path = this._buildFullPath(text, this.includePageName, this.mxform.path);
						ga("send", {
							"hitType": "pageview",
							"page": path,
							"title": this.mxform.title
						  });
					}));
				},
				resize: function (box) {
					logger.debug(this.id + ".resize");
				},
				uninitialize: function () {
					logger.debug(this.id + ".uninitialize");
				},
				_updateRendering: function (callback) {
					logger.debug(this.id + "._updateRendering");

					if (this._contextObj !== null) {
						dojoStyle.set(this.domNode, "display", "block");
					} else {
						dojoStyle.set(this.domNode, "display", "none");
					}

					this._executeCallback(callback, "_updateRendering");
				},
				// Shorthand for running a microflow
				_execMf: function (mf, guid, cb) {
					logger.debug(this.id + "._execMf");
					if (mf && guid) {
						mx.ui.action(mf, {
							params: {
								applyto: "selection",
								guids: [guid]
							},
							callback: lang.hitch(this, function (objs) {
								if (cb && typeof cb === "function") {
									cb(objs);
								}
							}),
							error: function (error) {
								console.debug(error.description);
							}
						}, this);
					}
				},
				// Shorthand for executing a callback, adds logging to your inspector
				_executeCallback: function (cb, from) {
					logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
					if (cb && typeof cb === "function") {
						cb();
					}
				},
				_addGoogle: function (i, s, o, g, r, a, m) {
					logger.debug(this.id + ".TrackerCore._addGoogle");
					if (typeof ga === "undefined") {
						i.GoogleAnalyticsObject = r;
						i[r] = i[r] || function () {
							(i[r].q = i[r].q || []).push(arguments);
						};
						i[r].l = 1 * new Date();
						a = s.createElement(o);
						m = s.getElementsByTagName(o)[0];
						a.async = 1;
						a.src = g;
						m.parentNode.insertBefore(a, m);
					}
				},
				_insertGoogleAnalytics: function () {
					logger.debug(this.id + ".TrackerCore._insertGoogleAnalytics");
					this._addGoogle(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");
					if (typeof window.MXGA === "undefined") {
						//ga("create", this.uaTrackCode, "auto");
						ga("create",this._contextObj.get(this.attr_uacode), "auto");
					}
					ga("set", "checkProtocolTask", null);
				}
			});
	}
);
require(["MxGA/widget/MxGA"]);



