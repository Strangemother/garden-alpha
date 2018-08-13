

var LIB;
(function (LIB) {
    var StereoscopicInterlacePostProcess = /** @class */ (function (_super) {
        __extends(StereoscopicInterlacePostProcess, _super);
        function StereoscopicInterlacePostProcess(name, rigCameras, isStereoscopicHoriz, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "stereoscopicInterlace", ['stepSize'], ['camASampler'], 1, rigCameras[1], samplingMode, engine, reusable, isStereoscopicHoriz ? "#define IS_STEREOSCOPIC_HORIZ 1" : undefined) || this;
            _this._passedProcess = rigCameras[0]._rigPostProcess;
            _this._stepSize = new LIB.Vector2(1 / _this.width, 1 / _this.height);
            _this.onSizeChangedObservable.add(function () {
                _this._stepSize = new LIB.Vector2(1 / _this.width, 1 / _this.height);
            });
            _this.onApplyObservable.add(function (effect) {
                effect.setTextureFromPostProcess("camASampler", _this._passedProcess);
                effect.setFloat2("stepSize", _this._stepSize.x, _this._stepSize.y);
            });
            return _this;
        }
        return StereoscopicInterlacePostProcess;
    }(LIB.PostProcess));
    LIB.StereoscopicInterlacePostProcess = StereoscopicInterlacePostProcess;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.stereoscopicInterlacePostProcess.js.map
//# sourceMappingURL=LIB.stereoscopicInterlacePostProcess.js.map
