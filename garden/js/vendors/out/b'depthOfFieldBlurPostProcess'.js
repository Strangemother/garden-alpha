

var LIB;
(function (LIB) {
    /**
     * The DepthOfFieldBlurPostProcess applied a blur in a give direction.
     * This blur differs from the standard BlurPostProcess as it attempts to avoid blurring pixels
     * based on samples that have a large difference in distance than the center pixel.
     * See section 2.6.2 http://fileadmin.cs.lth.se/cs/education/edan35/lectures/12dof.pdf
     */
    var DepthOfFieldBlurPostProcess = /** @class */ (function (_super) {
        __extends(DepthOfFieldBlurPostProcess, _super);
        /**
         * Creates a new instance CircleOfConfusionPostProcess
         * @param name The name of the effect.
         * @param scene The scene the effect belongs to.
         * @param direction The direction the blur should be applied.
         * @param kernel The size of the kernel used to blur.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param circleOfConfusion The circle of confusion + depth map to be used to avoid blurring accross edges
         * @param imageToBlur The image to apply the blur to (default: Current rendered frame)
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        function DepthOfFieldBlurPostProcess(name, scene, direction, kernel, options, camera, circleOfConfusion, imageToBlur, samplingMode, engine, reusable, textureType, blockCompilation) {
            if (imageToBlur === void 0) { imageToBlur = null; }
            if (samplingMode === void 0) { samplingMode = LIB.Texture.BILINEAR_SAMPLINGMODE; }
            if (textureType === void 0) { textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (blockCompilation === void 0) { blockCompilation = false; }
            var _this = _super.call(this, name, direction, kernel, options, camera, samplingMode = LIB.Texture.BILINEAR_SAMPLINGMODE, engine, reusable, textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT, "#define DOF 1\r\n", blockCompilation) || this;
            _this.direction = direction;
            _this.onApplyObservable.add(function (effect) {
                if (imageToBlur != null) {
                    effect.setTextureFromPostProcess("textureSampler", imageToBlur);
                }
                effect.setTextureFromPostProcessOutput("circleOfConfusionSampler", circleOfConfusion);
                if (scene.activeCamera) {
                    effect.setFloat2('cameraMinMaxZ', scene.activeCamera.minZ, scene.activeCamera.maxZ);
                }
            });
            return _this;
        }
        return DepthOfFieldBlurPostProcess;
    }(LIB.BlurPostProcess));
    LIB.DepthOfFieldBlurPostProcess = DepthOfFieldBlurPostProcess;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.depthOfFieldBlurPostProcess.js.map
//# sourceMappingURL=LIB.depthOfFieldBlurPostProcess.js.map
