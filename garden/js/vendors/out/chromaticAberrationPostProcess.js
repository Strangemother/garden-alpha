

var LIB;
(function (LIB) {
    /**
     * The ChromaticAberrationPostProcess separates the rgb channels in an image to produce chromatic distortion around the edges of the screen
     */
    var ChromaticAberrationPostProcess = /** @class */ (function (_super) {
        __extends(ChromaticAberrationPostProcess, _super);
        /**
         * Creates a new instance ChromaticAberrationPostProcess
         * @param name The name of the effect.
         * @param screenWidth The width of the screen to apply the effect on.
         * @param screenHeight The height of the screen to apply the effect on.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        function ChromaticAberrationPostProcess(name, screenWidth, screenHeight, options, camera, samplingMode, engine, reusable, textureType, blockCompilation) {
            if (textureType === void 0) { textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (blockCompilation === void 0) { blockCompilation = false; }
            var _this = _super.call(this, name, "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"], [], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation) || this;
            /**
             * The amount of seperation of rgb channels (default: 30)
             */
            _this.aberrationAmount = 30;
            /**
             * The amount the effect will increase for pixels closer to the edge of the screen. (default: 0)
             */
            _this.radialIntensity = 0;
            /**
             * The normilized direction in which the rgb channels should be seperated. If set to 0,0 radial direction will be used. (default: Vector2(0.707,0.707))
             */
            _this.direction = new LIB.Vector2(0.707, 0.707);
            /**
             * The center position where the radialIntensity should be around. [0.5,0.5 is center of screen, 1,1 is top right corder] (default: Vector2(0.5 ,0.5))
             */
            _this.centerPosition = new LIB.Vector2(0.5, 0.5);
            _this.onApplyObservable.add(function (effect) {
                effect.setFloat('chromatic_aberration', _this.aberrationAmount);
                effect.setFloat('screen_width', screenWidth);
                effect.setFloat('screen_height', screenHeight);
                effect.setFloat('radialIntensity', _this.radialIntensity);
                effect.setFloat2('direction', _this.direction.x, _this.direction.y);
                effect.setFloat2('centerPosition', _this.centerPosition.x, _this.centerPosition.y);
            });
            return _this;
        }
        return ChromaticAberrationPostProcess;
    }(LIB.PostProcess));
    LIB.ChromaticAberrationPostProcess = ChromaticAberrationPostProcess;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.chromaticAberrationPostProcess.js.map
//# sourceMappingURL=LIB.chromaticAberrationPostProcess.js.map
