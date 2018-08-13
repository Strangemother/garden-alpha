
// LIB.JS Chromatic Aberration GLSL Shader
// Author: Olivier Guyot
// Separates very slightly R, G and B colors on the edges of the screen
// Inspired by Francois Tarlier & Martins Upitis

var LIB;
(function (LIB) {
    var LensRenderingPipeline = /** @class */ (function (_super) {
        __extends(LensRenderingPipeline, _super);
        /**
         * @constructor
         *
         * Effect parameters are as follow:
         * {
         *      chromatic_aberration: number;       // from 0 to x (1 for realism)
         *      edge_blur: number;                  // from 0 to x (1 for realism)
         *      distortion: number;                 // from 0 to x (1 for realism)
         *      grain_amount: number;               // from 0 to 1
         *      grain_texture: LIB.Texture;     // texture to use for grain effect; if unset, use random B&W noise
         *      dof_focus_distance: number;         // depth-of-field: focus distance; unset to disable (disabled by default)
         *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
         *      dof_darken: number;                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
         *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
         *      dof_gain: number;                   // depth-of-field: highlights gain; unset to disable (disabled by default)
         *      dof_threshold: number;              // depth-of-field: highlights threshold (default: 1)
         *      blur_noise: boolean;                // add a little bit of noise to the blur (default: true)
         * }
         * Note: if an effect parameter is unset, effect is disabled
         *
         * @param {string} name - The rendering pipeline name
         * @param {object} parameters - An object containing all parameters (see above)
         * @param {LIB.Scene} scene - The scene linked to this pipeline
         * @param {number} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {LIB.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function LensRenderingPipeline(name, parameters, scene, ratio, cameras) {
            if (ratio === void 0) { ratio = 1.0; }
            var _this = _super.call(this, scene.getEngine(), name) || this;
            // Lens effects can be of the following:
            // - chromatic aberration (slight shift of RGB colors)
            // - blur on the edge of the lens
            // - lens distortion
            // - depth-of-field blur & highlights enhancing
            // - depth-of-field 'bokeh' effect (shapes appearing in blurred areas)
            // - grain effect (noise or custom texture)
            // Two additional texture samplers are needed:
            // - depth map (for depth-of-field)
            // - grain texture
            /**
            * The chromatic aberration PostProcess id in the pipeline
            */
            _this.LensChromaticAberrationEffect = "LensChromaticAberrationEffect";
            /**
            * The highlights enhancing PostProcess id in the pipeline
            */
            _this.HighlightsEnhancingEffect = "HighlightsEnhancingEffect";
            /**
            * The depth-of-field PostProcess id in the pipeline
            */
            _this.LensDepthOfFieldEffect = "LensDepthOfFieldEffect";
            _this._scene = scene;
            // Fetch texture samplers
            _this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
            if (parameters.grain_texture) {
                _this._grainTexture = parameters.grain_texture;
            }
            else {
                _this._createGrainTexture();
            }
            // save parameters
            _this._edgeBlur = parameters.edge_blur ? parameters.edge_blur : 0;
            _this._grainAmount = parameters.grain_amount ? parameters.grain_amount : 0;
            _this._chromaticAberration = parameters.chromatic_aberration ? parameters.chromatic_aberration : 0;
            _this._distortion = parameters.distortion ? parameters.distortion : 0;
            _this._highlightsGain = parameters.dof_gain !== undefined ? parameters.dof_gain : -1;
            _this._highlightsThreshold = parameters.dof_threshold ? parameters.dof_threshold : 1;
            _this._dofDistance = parameters.dof_focus_distance !== undefined ? parameters.dof_focus_distance : -1;
            _this._dofAperture = parameters.dof_aperture ? parameters.dof_aperture : 1;
            _this._dofDarken = parameters.dof_darken ? parameters.dof_darken : 0;
            _this._dofPentagon = parameters.dof_pentagon !== undefined ? parameters.dof_pentagon : true;
            _this._blurNoise = parameters.blur_noise !== undefined ? parameters.blur_noise : true;
            // Create effects
            _this._createChromaticAberrationPostProcess(ratio);
            _this._createHighlightsPostProcess(ratio);
            _this._createDepthOfFieldPostProcess(ratio / 4);
            // Set up pipeline
            _this.addEffect(new LIB.PostProcessRenderEffect(scene.getEngine(), _this.LensChromaticAberrationEffect, function () { return _this._chromaticAberrationPostProcess; }, true));
            _this.addEffect(new LIB.PostProcessRenderEffect(scene.getEngine(), _this.HighlightsEnhancingEffect, function () { return _this._highlightsPostProcess; }, true));
            _this.addEffect(new LIB.PostProcessRenderEffect(scene.getEngine(), _this.LensDepthOfFieldEffect, function () { return _this._depthOfFieldPostProcess; }, true));
            if (_this._highlightsGain === -1) {
                _this._disableEffect(_this.HighlightsEnhancingEffect, null);
            }
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(_this);
            if (cameras) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
            return _this;
        }
        // public methods (self explanatory)
        LensRenderingPipeline.prototype.setEdgeBlur = function (amount) { this._edgeBlur = amount; };
        LensRenderingPipeline.prototype.disableEdgeBlur = function () { this._edgeBlur = 0; };
        LensRenderingPipeline.prototype.setGrainAmount = function (amount) { this._grainAmount = amount; };
        LensRenderingPipeline.prototype.disableGrain = function () { this._grainAmount = 0; };
        LensRenderingPipeline.prototype.setChromaticAberration = function (amount) { this._chromaticAberration = amount; };
        LensRenderingPipeline.prototype.disableChromaticAberration = function () { this._chromaticAberration = 0; };
        LensRenderingPipeline.prototype.setEdgeDistortion = function (amount) { this._distortion = amount; };
        LensRenderingPipeline.prototype.disableEdgeDistortion = function () { this._distortion = 0; };
        LensRenderingPipeline.prototype.setFocusDistance = function (amount) { this._dofDistance = amount; };
        LensRenderingPipeline.prototype.disableDepthOfField = function () { this._dofDistance = -1; };
        LensRenderingPipeline.prototype.setAperture = function (amount) { this._dofAperture = amount; };
        LensRenderingPipeline.prototype.setDarkenOutOfFocus = function (amount) { this._dofDarken = amount; };
        LensRenderingPipeline.prototype.enablePentagonBokeh = function () {
            this._highlightsPostProcess.updateEffect("#define PENTAGON\n");
        };
        LensRenderingPipeline.prototype.disablePentagonBokeh = function () {
            this._highlightsPostProcess.updateEffect();
        };
        LensRenderingPipeline.prototype.enableNoiseBlur = function () { this._blurNoise = true; };
        LensRenderingPipeline.prototype.disableNoiseBlur = function () { this._blurNoise = false; };
        LensRenderingPipeline.prototype.setHighlightsGain = function (amount) {
            this._highlightsGain = amount;
        };
        LensRenderingPipeline.prototype.setHighlightsThreshold = function (amount) {
            if (this._highlightsGain === -1) {
                this._highlightsGain = 1.0;
            }
            this._highlightsThreshold = amount;
        };
        LensRenderingPipeline.prototype.disableHighlights = function () {
            this._highlightsGain = -1;
        };
        /**
         * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
         */
        LensRenderingPipeline.prototype.dispose = function (disableDepthRender) {
            if (disableDepthRender === void 0) { disableDepthRender = false; }
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
            this._chromaticAberrationPostProcess = null;
            this._highlightsPostProcess = null;
            this._depthOfFieldPostProcess = null;
            this._grainTexture.dispose();
            if (disableDepthRender)
                this._scene.disableDepthRenderer();
        };
        // colors shifting and distortion
        LensRenderingPipeline.prototype._createChromaticAberrationPostProcess = function (ratio) {
            var _this = this;
            this._chromaticAberrationPostProcess = new LIB.PostProcess("LensChromaticAberration", "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"], // uniforms
            [], // samplers
            ratio, null, LIB.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._chromaticAberrationPostProcess.onApply = function (effect) {
                effect.setFloat('chromatic_aberration', _this._chromaticAberration);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderWidth());
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderHeight());
                effect.setFloat('radialIntensity', 1);
                effect.setFloat2('direction', 17, 17);
                effect.setFloat2('centerPosition', 0.5, 0.5);
            };
        };
        // highlights enhancing
        LensRenderingPipeline.prototype._createHighlightsPostProcess = function (ratio) {
            var _this = this;
            this._highlightsPostProcess = new LIB.PostProcess("LensHighlights", "lensHighlights", ["gain", "threshold", "screen_width", "screen_height"], // uniforms
            [], // samplers
            ratio, null, LIB.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, this._dofPentagon ? "#define PENTAGON\n" : "");
            this._highlightsPostProcess.onApply = function (effect) {
                effect.setFloat('gain', _this._highlightsGain);
                effect.setFloat('threshold', _this._highlightsThreshold);
                effect.setTextureFromPostProcess("textureSampler", _this._chromaticAberrationPostProcess);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderWidth());
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderHeight());
            };
        };
        // colors shifting and distortion
        LensRenderingPipeline.prototype._createDepthOfFieldPostProcess = function (ratio) {
            var _this = this;
            this._depthOfFieldPostProcess = new LIB.PostProcess("LensDepthOfField", "depthOfField", [
                "grain_amount", "blur_noise", "screen_width", "screen_height", "distortion", "dof_enabled",
                "screen_distance", "aperture", "darken", "edge_blur", "highlights", "near", "far"
            ], ["depthSampler", "grainSampler", "highlightsSampler"], ratio, null, LIB.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._depthOfFieldPostProcess.onApply = function (effect) {
                effect.setTexture("depthSampler", _this._depthTexture);
                effect.setTexture("grainSampler", _this._grainTexture);
                effect.setTextureFromPostProcess("textureSampler", _this._highlightsPostProcess);
                effect.setTextureFromPostProcess("highlightsSampler", _this._depthOfFieldPostProcess);
                effect.setFloat('grain_amount', _this._grainAmount);
                effect.setBool('blur_noise', _this._blurNoise);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderWidth());
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderHeight());
                effect.setFloat('distortion', _this._distortion);
                effect.setBool('dof_enabled', (_this._dofDistance !== -1));
                effect.setFloat('screen_distance', 1.0 / (0.1 - 1.0 / _this._dofDistance));
                effect.setFloat('aperture', _this._dofAperture);
                effect.setFloat('darken', _this._dofDarken);
                effect.setFloat('edge_blur', _this._edgeBlur);
                effect.setBool('highlights', (_this._highlightsGain !== -1));
                if (_this._scene.activeCamera) {
                    effect.setFloat('near', _this._scene.activeCamera.minZ);
                    effect.setFloat('far', _this._scene.activeCamera.maxZ);
                }
            };
        };
        // creates a black and white random noise texture, 512x512
        LensRenderingPipeline.prototype._createGrainTexture = function () {
            var size = 512;
            this._grainTexture = new LIB.DynamicTexture("LensNoiseTexture", size, this._scene, false, LIB.Texture.BILINEAR_SAMPLINGMODE);
            this._grainTexture.wrapU = LIB.Texture.WRAP_ADDRESSMODE;
            this._grainTexture.wrapV = LIB.Texture.WRAP_ADDRESSMODE;
            var context = this._grainTexture.getContext();
            var rand = function (min, max) {
                return Math.random() * (max - min) + min;
            };
            var value;
            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    value = Math.floor(rand(0.42, 0.58) * 255);
                    context.fillStyle = 'rgb(' + value + ', ' + value + ', ' + value + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }
            this._grainTexture.update(false);
        };
        return LensRenderingPipeline;
    }(LIB.PostProcessRenderPipeline));
    LIB.LensRenderingPipeline = LensRenderingPipeline;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.lensRenderingPipeline.js.map
//# sourceMappingURL=LIB.lensRenderingPipeline.js.map
