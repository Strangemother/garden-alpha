
var LIB;
(function (LIB) {
    /**
     * This represents a set of one or more post processes in LIB.
     * A post process can be used to apply a shader to a texture after it is rendered.
     * @example https://doc.LIBjs.com/how_to/how_to_use_postprocessrenderpipeline
     */
    var PostProcessRenderEffect = /** @class */ (function () {
        /**
         * Instantiates a post process render effect.
         * A post process can be used to apply a shader to a texture after it is rendered.
         * @param engine The engine the effect is tied to
         * @param name The name of the effect
         * @param getPostProcesses A function that returns a set of post processes which the effect will run in order to be run.
         * @param singleInstance False if this post process can be run on multiple cameras. (default: true)
         */
        function PostProcessRenderEffect(engine, name, getPostProcesses, singleInstance) {
            this._name = name;
            this._singleInstance = singleInstance || true;
            this._getPostProcesses = getPostProcesses;
            this._cameras = {};
            this._indicesForCamera = {};
            this._postProcesses = {};
        }
        Object.defineProperty(PostProcessRenderEffect.prototype, "isSupported", {
            /**
             * Checks if all the post processes in the effect are supported.
             */
            get: function () {
                for (var index in this._postProcesses) {
                    if (this._postProcesses.hasOwnProperty(index)) {
                        var pps = this._postProcesses[index];
                        for (var ppIndex = 0; ppIndex < pps.length; ppIndex++) {
                            if (!pps[ppIndex].isSupported) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Updates the current state of the effect
         */
        PostProcessRenderEffect.prototype._update = function () {
        };
        /**
         * Attaches the effect on cameras
         * @param cameras The camera to attach to.
         */
        PostProcessRenderEffect.prototype._attachCameras = function (cameras) {
            var _this = this;
            var cameraKey;
            var cams = LIB.Tools.MakeArray(cameras || this._cameras);
            if (!cams) {
                return;
            }
            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;
                if (this._singleInstance) {
                    cameraKey = 0;
                }
                else {
                    cameraKey = cameraName;
                }
                if (!this._postProcesses[cameraKey]) {
                    var postProcess = this._getPostProcesses();
                    if (postProcess) {
                        this._postProcesses[cameraKey] = Array.isArray(postProcess) ? postProcess : [postProcess];
                    }
                }
                if (!this._indicesForCamera[cameraName]) {
                    this._indicesForCamera[cameraName] = [];
                }
                this._postProcesses[cameraKey].forEach(function (postProcess) {
                    var index = camera.attachPostProcess(postProcess);
                    _this._indicesForCamera[cameraName].push(index);
                });
                if (!this._cameras[cameraName]) {
                    this._cameras[cameraName] = camera;
                }
            }
        };
        /**
         * Detatches the effect on cameras
         * @param cameras The camera to detatch from.
         */
        PostProcessRenderEffect.prototype._detachCameras = function (cameras) {
            var cams = LIB.Tools.MakeArray(cameras || this._cameras);
            if (!cams) {
                return;
            }
            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;
                this._postProcesses[this._singleInstance ? 0 : cameraName].forEach(function (postProcess) {
                    camera.detachPostProcess(postProcess);
                });
                if (this._cameras[cameraName]) {
                    //this._indicesForCamera.splice(index, 1);
                    this._cameras[cameraName] = null;
                }
            }
        };
        /**
         * Enables the effect on given cameras
         * @param cameras The camera to enable.
         */
        PostProcessRenderEffect.prototype._enable = function (cameras) {
            var _this = this;
            var cams = LIB.Tools.MakeArray(cameras || this._cameras);
            if (!cams) {
                return;
            }
            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;
                for (var j = 0; j < this._indicesForCamera[cameraName].length; j++) {
                    if (camera._postProcesses[this._indicesForCamera[cameraName][j]] === undefined || camera._postProcesses[this._indicesForCamera[cameraName][j]] === null) {
                        this._postProcesses[this._singleInstance ? 0 : cameraName].forEach(function (postProcess) {
                            cams[i].attachPostProcess(postProcess, _this._indicesForCamera[cameraName][j]);
                        });
                    }
                }
            }
        };
        /**
         * Disables the effect on the given cameras
         * @param cameras The camera to disable.
         */
        PostProcessRenderEffect.prototype._disable = function (cameras) {
            var cams = LIB.Tools.MakeArray(cameras || this._cameras);
            if (!cams) {
                return;
            }
            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;
                this._postProcesses[this._singleInstance ? 0 : cameraName].forEach(function (postProcess) {
                    camera.detachPostProcess(postProcess);
                });
            }
        };
        /**
         * Gets a list of the post processes contained in the effect.
         * @param camera The camera to get the post processes on.
         * @returns The list of the post processes in the effect.
         */
        PostProcessRenderEffect.prototype.getPostProcesses = function (camera) {
            if (this._singleInstance) {
                return this._postProcesses[0];
            }
            else {
                if (!camera) {
                    return null;
                }
                return this._postProcesses[camera.name];
            }
        };
        return PostProcessRenderEffect;
    }());
    LIB.PostProcessRenderEffect = PostProcessRenderEffect;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.postProcessRenderEffect.js.map
//# sourceMappingURL=LIB.postProcessRenderEffect.js.map