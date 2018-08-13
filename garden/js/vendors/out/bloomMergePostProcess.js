

var LIB;
(function (LIB) {
    /**
     * The BloomMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
     */
    var BloomMergePostProcess = /** @class */ (function (_super) {
        __extends(BloomMergePostProcess, _super);
        /**
         * Creates a new instance of @see BloomMergePostProcess
         * @param name The name of the effect.
         * @param originalFromInput Post process which's input will be used for the merge.
         * @param blurred Blurred highlights post process which's output will be used.
         * @param weight Weight of the bloom to be added to the original input.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        function BloomMergePostProcess(name, originalFromInput, blurred, /** Weight of the bloom to be added to the original input. */ weight, options, camera, samplingMode, engine, reusable, textureType, blockCompilation) {
            if (textureType === void 0) { textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (blockCompilation === void 0) { blockCompilation = false; }
            var _this = _super.call(this, name, "bloomMerge", ["bloomWeight"], ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2", "bloomBlur"], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, true) || this;
            _this.weight = weight;
            _this.onApplyObservable.add(function (effect) {
                effect.setTextureFromPostProcess("textureSampler", originalFromInput);
                effect.setTextureFromPostProcessOutput("bloomBlur", blurred);
                effect.setFloat("bloomWeight", _this.weight);
            });
            if (!blockCompilation) {
                _this.updateEffect();
            }
            return _this;
        }
        return BloomMergePostProcess;
    }(LIB.PostProcess));
    LIB.BloomMergePostProcess = BloomMergePostProcess;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.bloomMergePostProcess.js.map
//# sourceMappingURL=LIB.bloomMergePostProcess.js.map
