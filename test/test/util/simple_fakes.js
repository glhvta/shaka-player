/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('shaka.test.FakeAbrManager');
goog.provide('shaka.test.FakeDrmEngine');
goog.provide('shaka.test.FakeManifestParser');
goog.provide('shaka.test.FakePlayhead');
goog.provide('shaka.test.FakePlayheadObserver');
goog.provide('shaka.test.FakePresentationTimeline');
goog.provide('shaka.test.FakeStreamingEngine');
goog.provide('shaka.test.FakeVideo');


/**
 * @fileoverview Defines simple mocks for library types.
 * @suppress {checkTypes} Suppress errors about missmatches between the
 *   definition and the interface.  This allows us to have the members be
 *   |jasmine.Spy|.  BE CAREFUL IN THIS FILE.
 */



/**
 * A fake AbrManager.
 *
 * @constructor
 * @struct
 * @extends {shaka.abr.SimpleAbrManager}
 * @return {!Object}
 */
shaka.test.FakeAbrManager = function() {
  var ret = jasmine.createSpyObj('FakeAbrManager', [
    'stop', 'init', 'enable', 'disable', 'segmentDownloaded',
    'getBandwidthEstimate', 'chooseStreams', 'setVariants', 'setTextStreams',
    'configure'
  ]);

  /** @type {!Array.<shakaExtern.Variant>} */
  var variants = [];
  /** @type {!Array.<shakaExtern.Stream>} */
  var textStreams = [];
  ret.chooseIndex = 0;

  ret.setVariants.and.callFake(function(arg) { variants = arg; });
  ret.setTextStreams.and.callFake(function(arg) { textStreams = arg; });
  ret.chooseStreams.and.callFake(function(mediaTypesToUpdate) {
    var ContentType = shaka.util.ManifestParserUtils.ContentType;
    var streams = {};
    var variant = variants[ret.chooseIndex];

    var textStream = null;
    if (textStreams.length > ret.chooseIndex)
      textStream = textStreams[ret.chooseIndex];

    if (mediaTypesToUpdate.indexOf(ContentType.AUDIO) > -1 ||
        mediaTypesToUpdate.indexOf(ContentType.VIDEO) > -1) {
      if (variant.audio) streams[ContentType.AUDIO] = variant.audio;
      if (variant.video) streams[ContentType.VIDEO] = variant.video;
    }

    if (mediaTypesToUpdate.indexOf(ContentType.TEXT) > -1 && textStream)
      streams[ContentType.TEXT] = textStream;

    return streams;
  });

  return ret;
};


/** @type {number} */
shaka.test.FakeAbrManager.prototype.chooseIndex;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.stop;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.init;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.enable;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.disable;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.segmentDownloaded;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.getBandwidthEstimate;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.chooseStreams;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.setVariants;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.setTextStreams;


/** @type {!jasmine.Spy} */
shaka.test.FakeAbrManager.prototype.configure;



/**
 * A fake DrmEngine.
 *
 * @constructor
 * @struct
 * @extends {shaka.media.DrmEngine}
 * @return {!Object}
 */
shaka.test.FakeDrmEngine = function() {
  var resolve = Promise.resolve.bind(Promise);
  var offlineSessionIds = [];
  var drmInfo = null;

  var ret = jasmine.createSpyObj('FakeDrmEngine', [
    'attach', 'configure', 'destroy', 'getDrmInfo', 'getExpiration',
    'getSessionIds', 'getSupportedTypes', 'init', 'initialized',
    'isSupportedByKeySystem', 'keySystem'
  ]);
  ret.attach.and.callFake(resolve);
  ret.destroy.and.callFake(resolve);
  ret.init.and.callFake(resolve);
  ret.initialized.and.returnValue(true);
  ret.keySystem.and.returnValue('com.example.fake');
  ret.getExpiration.and.returnValue(Infinity);
  // See shaka.test.ManifestGenerator.protototype.createStream.
  ret.getSupportedTypes.and.returnValue(
      ['video/mp4; codecs="avc1.4d401f"']);

  ret.setSessionIds = function(sessions) {
    offlineSessionIds = sessions;
  };
  ret.setDrmInfo = function(info) { drmInfo = info; };
  ret.getDrmInfo.and.callFake(function() { return drmInfo; });
  ret.getSessionIds.and.callFake(function() {
    return offlineSessionIds;
  });
  ret.isSupportedByKeySystem.and.returnValue(true);

  return ret;
};


/** @type {jasmine.Spy} */
shaka.test.FakeDrmEngine.prototype.init;


/** @type {jasmine.Spy} */
shaka.test.FakeDrmEngine.prototype.attach;


/** @type {jasmine.Spy} */
shaka.test.FakeDrmEngine.prototype.getExpiration;


/** @param {?shakaExtern.DrmInfo} info */
shaka.test.FakeDrmEngine.prototype.setDrmInfo;


/** @param {!Array.<string>} sessions */
shaka.test.FakeDrmEngine.prototype.setSessionIds;



/**
 * A fake StreamingEngine.
 *
 * @constructor
 * @struct
 * @extends {shaka.media.StreamingEngine}
 * @return {!Object}
 */
shaka.test.FakeStreamingEngine = function() {
  var ContentType = shaka.util.ManifestParserUtils.ContentType;
  var resolve = Promise.resolve.bind(Promise);
  var activeStreams = {};

  var ret = jasmine.createSpyObj('fakeStreamingEngine', [
    'destroy', 'configure', 'init', 'getCurrentPeriod', 'getActivePeriod',
    'getActiveStreams', 'notifyNewTextStream', 'switch', 'seeked'
  ]);
  ret.destroy.and.callFake(resolve);
  ret.getCurrentPeriod.and.returnValue(null);
  ret.getActivePeriod.and.returnValue(null);
  ret.getActiveStreams.and.returnValue(activeStreams);
  ret.notifyNewTextStream.and.callFake(resolve);
  ret.init.and.callFake(function() {
    var period = ret.getCurrentPeriod();
    var variant = period.variants[0];
    if (variant.audio)
      activeStreams[ContentType.AUDIO] = variant.audio;
    if (variant.video)
      activeStreams[ContentType.VIDEO] = variant.video;
    var text = period.textStreams[0];
    if (text)
      activeStreams[ContentType.TEXT] = text;
    return Promise.resolve();
  });
  ret.switch.and.callFake(function(type, stream) {
    activeStreams[type] = stream;
  });
  return ret;
};


/** @type {jasmine.Spy} */
shaka.test.FakeStreamingEngine.prototype.init;


/** @type {jasmine.Spy} */
shaka.test.FakeStreamingEngine.prototype.switch;


/** @type {jasmine.Spy} */
shaka.test.FakeStreamingEngine.prototype.getCurrentPeriod;



/**
 * Creates a fake manifest parser.
 *
 * @constructor
 * @param {shakaExtern.Manifest} manifest
 * @struct
 * @implements {shakaExtern.ManifestParser}
 * @return {!Object}
 */
shaka.test.FakeManifestParser = function(manifest) {
  var ret = jasmine.createSpyObj('FakeManifestParser', [
    'start', 'stop', 'configure', 'update', 'onExpirationUpdated'
  ]);
  ret.start.and.returnValue(Promise.resolve(manifest));
  ret.stop.and.returnValue(Promise.resolve());
  return ret;
};


/** @type {!jasmine.Spy} */
shaka.test.FakeManifestParser.prototype.start;


/** @type {!jasmine.Spy} */
shaka.test.FakeManifestParser.prototype.stop;


/** @type {!jasmine.Spy} */
shaka.test.FakeManifestParser.prototype.update;


/** @type {!jasmine.Spy} */
shaka.test.FakeManifestParser.prototype.onExpirationUpdated;


/** @type {!jasmine.Spy} */
shaka.test.FakeManifestParser.prototype.configure;



/**
 * Creates a fake video element.
 * @param {number=} opt_currentTime
 *
 * @constructor
 * @struct
 * @extends {HTMLVideoElement}
 * @return {!Object}
 */
shaka.test.FakeVideo = function(opt_currentTime) {
  var video = {
    currentTime: opt_currentTime || 0,
    readyState: 0,
    playbackRate: 1,
    volume: 1,
    muted: false,
    loop: false,
    autoplay: false,
    paused: false,
    buffered: null,
    src: '',
    textTracks: [],

    addTextTrack: jasmine.createSpy('addTextTrack'),
    setMediaKeys: jasmine.createSpy('createMediaKeys'),
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener'),
    removeAttribute: jasmine.createSpy('removeAttribute'),
    load: jasmine.createSpy('load'),
    play: jasmine.createSpy('play'),
    pause: jasmine.createSpy('pause'),
    dispatchEvent: jasmine.createSpy('dispatchEvent'),

    on: {}  // event listeners
  };
  video.setMediaKeys.and.returnValue(Promise.resolve());
  video.addTextTrack.and.callFake(function(kind, id) {
    // TODO: mock TextTrack, if/when Player starts directly accessing it.
    var track = {};
    video.textTracks.push(track);
    return track;
  });
  video.addEventListener.and.callFake(function(name, callback) {
    video.on[name] = callback;
  });

  return video;
};


/** @const {!Object.<string, !Function>} */
shaka.test.FakeVideo.prototype.on;


/** @type {!jasmine.Spy} */
shaka.test.FakeVideo.prototype.play;


/** @type {!jasmine.Spy} */
shaka.test.FakeVideo.prototype.setMediaKeys;


/**
 * Creates a fake buffered ranges object.
 *
 * @param {!Array.<{start: number, end: number}>} ranges
 * @return {!TimeRanges}
 */
function createFakeBuffered(ranges) {
  return /** @type {!TimeRanges} */({
    length: ranges.length,
    start: function(i) {
      if (i >= 0 && i < ranges.length) return ranges[i].start;
      throw new Error('Unexpected index');
    },
    end: function(i) {
      if (i >= 0 && i < ranges.length) return ranges[i].end;
      throw new Error('Unexpected index');
    }
  });
}



/**
 * Creates a fake PresentationTimeline object.
 *
 * @constructor
 * @struct
 * @extends {shaka.media.PresentationTimeline}
 * @return {!Object}
 */
shaka.test.FakePresentationTimeline = function() {
  var getStart = jasmine.createSpy('getSegmentAvailabilityStart');
  var getSafeStart = jasmine.createSpy('getSafeAvailabilityStart');
  getSafeStart.and.callFake(function(delay) {
    return shaka.test.Util.invokeSpy(getStart) + delay;
  });

  return {
    getDuration: jasmine.createSpy('getDuration'),
    setDuration: jasmine.createSpy('setDuration'),
    getPresentationStartTime: jasmine.createSpy('getPresentationStartTime'),
    setClockOffset: jasmine.createSpy('setClockOffset'),
    setStatic: jasmine.createSpy('setStatic'),
    getSegmentAvailabilityDuration:
        jasmine.createSpy('getSegmentAvailabilityDuration'),
    notifySegments: jasmine.createSpy('notifySegments'),
    notifyMaxSegmentDuration: jasmine.createSpy('notifyMaxSegmentDuration'),
    isLive: jasmine.createSpy('isLive'),
    isInProgress: jasmine.createSpy('isInProgress'),
    getSegmentAvailabilityStart: getStart,
    getSafeAvailabilityStart: getSafeStart,
    getSegmentAvailabilityEnd: jasmine.createSpy('getSegmentAvailabilityEnd'),
    getSeekRangeEnd: jasmine.createSpy('getSeekRangeEnd')
  };
};


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getDuration;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.setDuration;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getPresentationStartTime;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.setClockOffset;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.setStatic;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getSegmentAvailabilityDuration;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.notifySegments;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.notifyMaxSegmentDuration;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.isLive;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.isInProgress;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getSegmentAvailabilityStart;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getSafeAvailabilityStart;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getSegmentAvailabilityEnd;


/** @type {jasmine.Spy} */
shaka.test.FakePresentationTimeline.prototype.getSeekRangeEnd;



/**
 * Creates a fake Playhead object.
 *
 * @constructor
 * @struct
 * @extends {shaka.media.Playhead}
 * @return {!Object}
 */
shaka.test.FakePlayhead = function() {
  return {
    destroy: jasmine.createSpy('destroy').and.returnValue(Promise.resolve()),
    setRebufferingGoal: jasmine.createSpy('setRebufferingGoal'),
    setStartTime: jasmine.createSpy('setStartTime'),
    getTime: jasmine.createSpy('getTime').and.returnValue(0),
    setBuffering: jasmine.createSpy('setBuffering'),
    getPlaybackRate: jasmine.createSpy('getPlaybackRate').and.returnValue(1),
    setPlaybackRate: jasmine.createSpy('setPlaybackRate')
  };
};


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.destroy;


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.setRebufferingGoal;


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.setStartTime;


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.getTime;


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.setBuffering;


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.getPlaybackRate;


/** @type {!jasmine.Spy} */
shaka.test.FakePlayhead.prototype.setPlaybackRate;



/**
 * Creates a fake PlayheadObserver object.
 *
 * @constructor
 * @struct
 * @extends {shaka.media.PlayheadObserver}
 * @return {!Object}
 */
shaka.test.FakePlayheadObserver = function() {
  return {
    destroy: jasmine.createSpy('destroy').and.returnValue(Promise.resolve()),
    seeked: jasmine.createSpy('seeked'),
    setRebufferingGoal: jasmine.createSpy('setRebufferingGoal'),
    addTimelineRegion: jasmine.createSpy('addTimelineRegion')
  };
};


/** @type {jasmine.Spy} */
shaka.test.FakePlayheadObserver.prototype.seeked;


/** @type {jasmine.Spy} */
shaka.test.FakePlayheadObserver.prototype.setRebufferingGoal;


/** @type {jasmine.Spy} */
shaka.test.FakePlayheadObserver.prototype.addTimelineRegion;
