
var LIB;
(function (LIB) {
    /**
     * This class can be used to get instrumentation data from a LIB engine
     */
    var EngineInstrumentation = /** @class */ (function () {
        function EngineInstrumentation(engine) {
            this.engine = engine;
            this._captureGPUFrameTime = false;
            this._gpuFrameTime = new LIB.PerfCounter();
            this._captureShaderCompilationTime = false;
            this._shaderCompilationTime = new LIB.PerfCounter();
            // Observers
            this._onBeginFrameObserver = null;
            this._onEndFrameObserver = null;
            this._onBeforeShaderCompilationObserver = null;
            this._onAfterShaderCompilationObserver = null;
        }
        Object.defineProperty(EngineInstrumentation.prototype, "gpuFrameTimeCounter", {
            // Properties
            /**
             * Gets the perf counter used for GPU frame time
             */
            get: function () {
                return this._gpuFrameTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EngineInstrumentation.prototype, "captureGPUFrameTime", {
            /**
             * Gets the GPU frame time capture status
             */
            get: function () {
                return this._captureGPUFrameTime;
            },
            /**
             * Enable or disable the GPU frame time capture
             */
            set: function (value) {
                var _this = this;
                if (value === this._captureGPUFrameTime) {
                    return;
                }
                this._captureGPUFrameTime = value;
                if (value) {
                    this._onBeginFrameObserver = this.engine.onBeginFrameObservable.add(function () {
                        if (!_this._gpuFrameTimeToken) {
                            _this._gpuFrameTimeToken = _this.engine.startTimeQuery();
                        }
                    });
                    this._onEndFrameObserver = this.engine.onEndFrameObservable.add(function () {
                        if (!_this._gpuFrameTimeToken) {
                            return;
                        }
                        var time = _this.engine.endTimeQuery(_this._gpuFrameTimeToken);
                        if (time > -1) {
                            _this._gpuFrameTimeToken = null;
                            _this._gpuFrameTime.fetchNewFrame();
                            _this._gpuFrameTime.addCount(time, true);
                        }
                    });
                }
                else {
                    this.engine.onBeginFrameObservable.remove(this._onBeginFrameObserver);
                    this._onBeginFrameObserver = null;
                    this.engine.onEndFrameObservable.remove(this._onEndFrameObserver);
                    this._onEndFrameObserver = null;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EngineInstrumentation.prototype, "shaderCompilationTimeCounter", {
            /**
             * Gets the perf counter used for shader compilation time
             */
            get: function () {
                return this._shaderCompilationTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EngineInstrumentation.prototype, "captureShaderCompilationTime", {
            /**
             * Gets the shader compilation time capture status
             */
            get: function () {
                return this._captureShaderCompilationTime;
            },
            /**
             * Enable or disable the shader compilation time capture
             */
            set: function (value) {
                var _this = this;
                if (value === this._captureShaderCompilationTime) {
                    return;
                }
                this._captureShaderCompilationTime = value;
                if (value) {
                    this._onBeforeShaderCompilationObserver = this.engine.onBeforeShaderCompilationObservable.add(function () {
                        _this._shaderCompilationTime.fetchNewFrame();
                        _this._shaderCompilationTime.beginMonitoring();
                    });
                    this._onAfterShaderCompilationObserver = this.engine.onAfterShaderCompilationObservable.add(function () {
                        _this._shaderCompilationTime.endMonitoring();
                    });
                }
                else {
                    this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
                    this._onBeforeShaderCompilationObserver = null;
                    this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
                    this._onAfterShaderCompilationObserver = null;
                }
            },
            enumerable: true,
            configurable: true
        });
        EngineInstrumentation.prototype.dispose = function () {
            this.engine.onBeginFrameObservable.remove(this._onBeginFrameObserver);
            this._onBeginFrameObserver = null;
            this.engine.onEndFrameObservable.remove(this._onEndFrameObserver);
            this._onEndFrameObserver = null;
            this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
            this._onBeforeShaderCompilationObserver = null;
            this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
            this._onAfterShaderCompilationObserver = null;
            this.engine = null;
        };
        return EngineInstrumentation;
    }());
    LIB.EngineInstrumentation = EngineInstrumentation;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.engineInstrumentation.js.map
//# sourceMappingURL=LIB.engineInstrumentation.js.map