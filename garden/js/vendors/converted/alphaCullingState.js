
var LIB;
(function (LIB) {
    /**
     * @hidden
     **/
    var _AlphaState = /** @class */ (function () {
        /**
         * Initializes the state.
         */
        function _AlphaState() {
            this._isAlphaBlendDirty = false;
            this._isBlendFunctionParametersDirty = false;
            this._isBlendEquationParametersDirty = false;
            this._isBlendConstantsDirty = false;
            this._alphaBlend = false;
            this._blendFunctionParameters = new Array(4);
            this._blendEquationParameters = new Array(2);
            this._blendConstants = new Array(4);
            this.reset();
        }
        Object.defineProperty(_AlphaState.prototype, "isDirty", {
            get: function () {
                return this._isAlphaBlendDirty || this._isBlendFunctionParametersDirty;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(_AlphaState.prototype, "alphaBlend", {
            get: function () {
                return this._alphaBlend;
            },
            set: function (value) {
                if (this._alphaBlend === value) {
                    return;
                }
                this._alphaBlend = value;
                this._isAlphaBlendDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        _AlphaState.prototype.setAlphaBlendConstants = function (r, g, b, a) {
            if (this._blendConstants[0] === r &&
                this._blendConstants[1] === g &&
                this._blendConstants[2] === b &&
                this._blendConstants[3] === a) {
                return;
            }
            this._blendConstants[0] = r;
            this._blendConstants[1] = g;
            this._blendConstants[2] = b;
            this._blendConstants[3] = a;
            this._isBlendConstantsDirty = true;
        };
        _AlphaState.prototype.setAlphaBlendFunctionParameters = function (value0, value1, value2, value3) {
            if (this._blendFunctionParameters[0] === value0 &&
                this._blendFunctionParameters[1] === value1 &&
                this._blendFunctionParameters[2] === value2 &&
                this._blendFunctionParameters[3] === value3) {
                return;
            }
            this._blendFunctionParameters[0] = value0;
            this._blendFunctionParameters[1] = value1;
            this._blendFunctionParameters[2] = value2;
            this._blendFunctionParameters[3] = value3;
            this._isBlendFunctionParametersDirty = true;
        };
        _AlphaState.prototype.setAlphaEquationParameters = function (rgb, alpha) {
            if (this._blendEquationParameters[0] === rgb &&
                this._blendEquationParameters[1] === alpha) {
                return;
            }
            this._blendEquationParameters[0] = rgb;
            this._blendEquationParameters[1] = alpha;
            this._isBlendEquationParametersDirty = true;
        };
        _AlphaState.prototype.reset = function () {
            this._alphaBlend = false;
            this._blendFunctionParameters[0] = null;
            this._blendFunctionParameters[1] = null;
            this._blendFunctionParameters[2] = null;
            this._blendFunctionParameters[3] = null;
            this._blendEquationParameters[0] = null;
            this._blendEquationParameters[1] = null;
            this._blendConstants[0] = null;
            this._blendConstants[1] = null;
            this._blendConstants[2] = null;
            this._blendConstants[3] = null;
            this._isAlphaBlendDirty = true;
            this._isBlendFunctionParametersDirty = false;
            this._isBlendEquationParametersDirty = false;
            this._isBlendConstantsDirty = false;
        };
        _AlphaState.prototype.apply = function (gl) {
            if (!this.isDirty) {
                return;
            }
            // Alpha blend
            if (this._isAlphaBlendDirty) {
                if (this._alphaBlend) {
                    gl.enable(gl.BLEND);
                }
                else {
                    gl.disable(gl.BLEND);
                }
                this._isAlphaBlendDirty = false;
            }
            // Alpha function
            if (this._isBlendFunctionParametersDirty) {
                gl.blendFuncSeparate(this._blendFunctionParameters[0], this._blendFunctionParameters[1], this._blendFunctionParameters[2], this._blendFunctionParameters[3]);
                this._isBlendFunctionParametersDirty = false;
            }
            // Alpha equation
            if (this._isBlendEquationParametersDirty) {
                gl.blendEquationSeparate(this._isBlendEquationParametersDirty[0], this._isBlendEquationParametersDirty[1]);
                this._isBlendEquationParametersDirty = false;
            }
            // Constants
            if (this._isBlendConstantsDirty) {
                gl.blendColor(this._blendConstants[0], this._blendConstants[1], this._blendConstants[2], this._blendConstants[3]);
                this._isBlendConstantsDirty = false;
            }
        };
        return _AlphaState;
    }());
    LIB._AlphaState = _AlphaState;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.alphaCullingState.js.map
//# sourceMappingURL=LIB.alphaCullingState.js.map