






var LIB;
(function (LIB) {
    var ImageProcessingPostProcess = /** @class */ (function (_super) {
        __extends(ImageProcessingPostProcess, _super);
        function ImageProcessingPostProcess(name, options, camera, samplingMode, engine, reusable, textureType, imageProcessingConfiguration) {
            if (camera === void 0) { camera = null; }
            if (textureType === void 0) { textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT; }
            var _this = _super.call(this, name, "imageProcessing", [], [], options, camera, samplingMode, engine, reusable, null, textureType, "postprocess", null, true) || this;
            _this._fromLinearSpace = true;
            /**
             * Defines cache preventing GC.
             */
            _this._defines = {
                IMAGEPROCESSING: false,
                VIGNETTE: false,
                VIGNETTEBLENDMODEMULTIPLY: false,
                VIGNETTEBLENDMODEOPAQUE: false,
                TONEMAPPING: false,
                CONTRAST: false,
                COLORCURVES: false,
                COLORGRADING: false,
                COLORGRADING3D: false,
                FROMLINEARSPACE: false,
                SAMPLER3DGREENDEPTH: false,
                SAMPLER3DBGRMAP: false,
                IMAGEPROCESSINGPOSTPROCESS: false,
                EXPOSURE: false,
            };
            // Setup the configuration as forced by the constructor. This would then not force the 
            // scene materials output in linear space and let untouched the default forward pass.
            if (imageProcessingConfiguration) {
                imageProcessingConfiguration.applyByPostProcess = true;
                _this._attachImageProcessingConfiguration(imageProcessingConfiguration, true);
                // This will cause the shader to be compiled
                _this.fromLinearSpace = false;
            }
            // Setup the default processing configuration to the scene.
            else {
                _this._attachImageProcessingConfiguration(null, true);
                _this.imageProcessingConfiguration.applyByPostProcess = true;
            }
            _this.onApply = function (effect) {
                _this.imageProcessingConfiguration.bind(effect, _this.aspectRatio);
            };
            return _this;
        }
        Object.defineProperty(ImageProcessingPostProcess.prototype, "imageProcessingConfiguration", {
            /**
             * Gets the image processing configuration used either in this material.
             */
            get: function () {
                return this._imageProcessingConfiguration;
            },
            /**
             * Sets the Default image processing configuration used either in the this material.
             *
             * If sets to null, the scene one is in use.
             */
            set: function (value) {
                this._attachImageProcessingConfiguration(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration
         */
        ImageProcessingPostProcess.prototype._attachImageProcessingConfiguration = function (configuration, doNotBuild) {
            var _this = this;
            if (doNotBuild === void 0) { doNotBuild = false; }
            if (configuration === this._imageProcessingConfiguration) {
                return;
            }
            // Detaches observer.
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }
            // Pick the scene configuration if needed.
            if (!configuration) {
                var scene = null;
                var engine = this.getEngine();
                var camera = this.getCamera();
                if (camera) {
                    scene = camera.getScene();
                }
                else if (engine && engine.scenes) {
                    var scenes = engine.scenes;
                    scene = scenes[scenes.length - 1];
                }
                else {
                    scene = LIB.Engine.LastCreatedScene;
                }
                this._imageProcessingConfiguration = scene.imageProcessingConfiguration;
            }
            else {
                this._imageProcessingConfiguration = configuration;
            }
            // Attaches observer.
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(function (conf) {
                _this._updateParameters();
            });
            // Ensure the effect will be rebuilt.
            if (!doNotBuild) {
                this._updateParameters();
            }
        };
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorCurves", {
            /**
             * Gets Color curves setup used in the effect if colorCurvesEnabled is set to true .
             */
            get: function () {
                return this.imageProcessingConfiguration.colorCurves;
            },
            /**
             * Sets Color curves setup used in the effect if colorCurvesEnabled is set to true .
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorCurves = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorCurvesEnabled", {
            /**
             * Gets wether the color curves effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorCurvesEnabled;
            },
            /**
             * Sets wether the color curves effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorCurvesEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorGradingTexture", {
            /**
             * Gets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorGradingTexture;
            },
            /**
             * Sets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorGradingTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorGradingEnabled", {
            /**
             * Gets wether the color grading effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorGradingEnabled;
            },
            /**
             * Gets wether the color grading effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorGradingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "exposure", {
            /**
             * Gets exposure used in the effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.exposure;
            },
            /**
             * Sets exposure used in the effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.exposure = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "toneMappingEnabled", {
            /**
             * Gets wether tonemapping is enabled or not.
             */
            get: function () {
                return this._imageProcessingConfiguration.toneMappingEnabled;
            },
            /**
             * Sets wether tonemapping is enabled or not
             */
            set: function (value) {
                this._imageProcessingConfiguration.toneMappingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(ImageProcessingPostProcess.prototype, "contrast", {
            /**
             * Gets contrast used in the effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.contrast;
            },
            /**
             * Sets contrast used in the effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.contrast = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteStretch", {
            /**
             * Gets Vignette stretch size.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteStretch;
            },
            /**
             * Sets Vignette stretch size.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteStretch = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteCentreX", {
            /**
             * Gets Vignette centre X Offset.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteCentreX;
            },
            /**
             * Sets Vignette centre X Offset.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteCentreX = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteCentreY", {
            /**
             * Gets Vignette centre Y Offset.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteCentreY;
            },
            /**
             * Sets Vignette centre Y Offset.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteCentreY = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteWeight", {
            /**
             * Gets Vignette weight or intensity of the vignette effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteWeight;
            },
            /**
             * Sets Vignette weight or intensity of the vignette effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteWeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteColor", {
            /**
             * Gets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
             * if vignetteEnabled is set to true.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteColor;
            },
            /**
             * Sets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
             * if vignetteEnabled is set to true.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteCameraFov", {
            /**
             * Gets Camera field of view used by the Vignette effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteCameraFov;
            },
            /**
             * Sets Camera field of view used by the Vignette effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteCameraFov = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteBlendMode", {
            /**
             * Gets the vignette blend mode allowing different kind of effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteBlendMode;
            },
            /**
             * Sets the vignette blend mode allowing different kind of effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteBlendMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteEnabled", {
            /**
             * Gets wether the vignette effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteEnabled;
            },
            /**
             * Sets wether the vignette effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "fromLinearSpace", {
            /**
             * Gets wether the input of the processing is in Gamma or Linear Space.
             */
            get: function () {
                return this._fromLinearSpace;
            },
            /**
             * Sets wether the input of the processing is in Gamma or Linear Space.
             */
            set: function (value) {
                if (this._fromLinearSpace === value) {
                    return;
                }
                this._fromLinearSpace = value;
                this._updateParameters();
            },
            enumerable: true,
            configurable: true
        });
        ImageProcessingPostProcess.prototype.getClassName = function () {
            return "ImageProcessingPostProcess";
        };
        ImageProcessingPostProcess.prototype._updateParameters = function () {
            this._defines.FROMLINEARSPACE = this._fromLinearSpace;
            this.imageProcessingConfiguration.prepareDefines(this._defines, true);
            var defines = "";
            for (var define in this._defines) {
                if (this._defines[define]) {
                    defines += "#define " + define + ";\r\n";
                }
            }
            var samplers = ["textureSampler"];
            LIB.ImageProcessingConfiguration.PrepareSamplers(samplers, this._defines);
            var uniforms = ["scale"];
            LIB.ImageProcessingConfiguration.PrepareUniforms(uniforms, this._defines);
            this.updateEffect(defines, uniforms, samplers);
        };
        ImageProcessingPostProcess.prototype.dispose = function (camera) {
            _super.prototype.dispose.call(this, camera);
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }
            this.imageProcessingConfiguration.applyByPostProcess = false;
        };
        __decorate([
            LIB.serialize()
        ], ImageProcessingPostProcess.prototype, "_fromLinearSpace", void 0);
        return ImageProcessingPostProcess;
    }(LIB.PostProcess));
    LIB.ImageProcessingPostProcess = ImageProcessingPostProcess;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.imageProcessingPostProcess.js.map
//# sourceMappingURL=LIB.imageProcessingPostProcess.js.map