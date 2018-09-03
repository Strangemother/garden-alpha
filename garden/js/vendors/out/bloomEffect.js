

var LIB;
(function (LIB) {
    /**
     * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
     */
    var BloomEffect = /** @class */ (function (_super) {
        __extends(BloomEffect, _super);
        /**
         * Creates a new instance of @see BloomEffect
         * @param scene The scene the effect belongs to.
         * @param bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
         * @param bloomKernel The size of the kernel to be used when applying the blur.
         * @param bloomWeight The the strength of bloom.
         * @param pipelineTextureType The type of texture to be used when performing the post processing.
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        function BloomEffect(scene, bloomScale, bloomWeight, bloomKernel, pipelineTextureType, blockCompilation) {
            if (pipelineTextureType === void 0) { pipelineTextureType = 0; }
            if (blockCompilation === void 0) { blockCompilation = false; }
            var _this = _super.call(this, scene.getEngine(), "bloom", function () {
                return _this._effects;
            }, true) || this;
            _this.bloomScale = bloomScale;
            /**
             * Internal
             */
            _this._effects = [];
            _this._downscale = new LIB.ExtractHighlightsPostProcess("highlights", 1.0, null, LIB.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);
            _this._blurX = new LIB.BlurPostProcess("horizontal blur", new LIB.Vector2(1.0, 0), 10.0, bloomScale, null, LIB.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
            _this._blurX.alwaysForcePOT = true;
            _this._blurX.autoClear = false;
            _this._blurY = new LIB.BlurPostProcess("vertical blur", new LIB.Vector2(0, 1.0), 10.0, bloomScale, null, LIB.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
            _this._blurY.alwaysForcePOT = true;
            _this._blurY.autoClear = false;
            _this.kernel = bloomKernel;
            _this._effects = [_this._downscale, _this._blurX, _this._blurY];
            _this._merge = new LIB.BloomMergePostProcess("bloomMerge", _this._downscale, _this._blurY, bloomWeight, bloomScale, null, LIB.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);
            _this._merge.autoClear = false;
            _this._effects.push(_this._merge);
            return _this;
        }
        Object.defineProperty(BloomEffect.prototype, "threshold", {
            /**
             * The luminance threshold to find bright areas of the image to bloom.
             */
            get: function () {
                return this._downscale.threshold;
            },
            set: function (value) {
                this._downscale.threshold = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BloomEffect.prototype, "weight", {
            /**
             * The strength of the bloom.
             */
            get: function () {
                return this._merge.weight;
            },
            set: function (value) {
                this._merge.weight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BloomEffect.prototype, "kernel", {
            /**
             * Specifies the size of the bloom blur kernel, relative to the final output size
             */
            get: function () {
                return this._blurX.kernel / this.bloomScale;
            },
            set: function (value) {
                this._blurX.kernel = value * this.bloomScale;
                this._blurY.kernel = value * this.bloomScale;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposes each of the internal effects for a given camera.
         * @param camera The camera to dispose the effect on.
         */
        BloomEffect.prototype.disposeEffects = function (camera) {
            for (var effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
                this._effects[effectIndex].dispose(camera);
            }
        };
        /**
         * Internal
         */
        BloomEffect.prototype._updateEffects = function () {
            for (var effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
                this._effects[effectIndex].updateEffect();
            }
        };
        /**
         * Internal
         * @returns if all the contained post processes are ready.
         */
        BloomEffect.prototype._isReady = function () {
            for (var effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
                if (!this._effects[effectIndex].isReady()) {
                    return false;
                }
            }
            return true;
        };
        return BloomEffect;
    }(LIB.PostProcessRenderEffect));
    LIB.BloomEffect = BloomEffect;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.bloomEffect.js.map
//# sourceMappingURL=LIB.bloomEffect.js.map