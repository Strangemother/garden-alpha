

var LIB;
(function (LIB) {
    /**
     * This represents a color grading texture. This acts as a lookup table LUT, useful during post process
     * It can help converting any input color in a desired output one. This can then be used to create effects
     * from sepia, black and white to sixties or futuristic rendering...
     *
     * The only supported format is currently 3dl.
     * More information on LUT: https://en.wikipedia.org/wiki/3D_lookup_table/
     */
    var ColorGradingTexture = /** @class */ (function (_super) {
        __extends(ColorGradingTexture, _super);
        /**
         * Instantiates a ColorGradingTexture from the following parameters.
         *
         * @param url The location of the color gradind data (currently only supporting 3dl)
         * @param scene The scene the texture will be used in
         */
        function ColorGradingTexture(url, scene) {
            var _this = _super.call(this, scene) || this;
            if (!url) {
                return _this;
            }
            _this._engine = scene.getEngine();
            _this._textureMatrix = LIB.Matrix.Identity();
            _this.name = url;
            _this.url = url;
            _this.hasAlpha = false;
            _this.isCube = false;
            _this.is3D = _this._engine.webGLVersion > 1;
            _this.wrapU = LIB.Texture.CLAMP_ADDRESSMODE;
            _this.wrapV = LIB.Texture.CLAMP_ADDRESSMODE;
            _this.wrapR = LIB.Texture.CLAMP_ADDRESSMODE;
            _this.anisotropicFilteringLevel = 1;
            _this._texture = _this._getFromCache(url, true);
            if (!_this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    _this.loadTexture();
                }
                else {
                    _this.delayLoadState = LIB.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
            return _this;
        }
        /**
         * Returns the texture matrix used in most of the material.
         * This is not used in color grading but keep for troubleshooting purpose (easily swap diffuse by colorgrading to look in).
         */
        ColorGradingTexture.prototype.getTextureMatrix = function () {
            return this._textureMatrix;
        };
        /**
         * Occurs when the file being loaded is a .3dl LUT file.
         */
        ColorGradingTexture.prototype.load3dlTexture = function () {
            var engine = this._engine;
            var texture;
            if (engine.webGLVersion === 1) {
                texture = engine.createRawTexture(null, 1, 1, LIB.Engine.TEXTUREFORMAT_RGBA, false, false, LIB.Texture.BILINEAR_SAMPLINGMODE);
            }
            else {
                texture = engine.createRawTexture3D(null, 1, 1, 1, LIB.Engine.TEXTUREFORMAT_RGBA, false, false, LIB.Texture.BILINEAR_SAMPLINGMODE);
            }
            this._texture = texture;
            var callback = function (text) {
                if (typeof text !== "string") {
                    return;
                }
                var data = null;
                var tempData = null;
                var line;
                var lines = text.split('\n');
                var size = 0, pixelIndexW = 0, pixelIndexH = 0, pixelIndexSlice = 0;
                var maxColor = 0;
                for (var i = 0; i < lines.length; i++) {
                    line = lines[i];
                    if (!ColorGradingTexture._noneEmptyLineRegex.test(line))
                        continue;
                    if (line.indexOf('#') === 0)
                        continue;
                    var words = line.split(" ");
                    if (size === 0) {
                        // Number of space + one
                        size = words.length;
                        data = new Uint8Array(size * size * size * 4); // volume texture of side size and rgb 8
                        tempData = new Float32Array(size * size * size * 4);
                        continue;
                    }
                    if (size != 0) {
                        var r = Math.max(parseInt(words[0]), 0);
                        var g = Math.max(parseInt(words[1]), 0);
                        var b = Math.max(parseInt(words[2]), 0);
                        maxColor = Math.max(r, maxColor);
                        maxColor = Math.max(g, maxColor);
                        maxColor = Math.max(b, maxColor);
                        var pixelStorageIndex = (pixelIndexW + pixelIndexSlice * size + pixelIndexH * size * size) * 4;
                        if (tempData) {
                            tempData[pixelStorageIndex + 0] = r;
                            tempData[pixelStorageIndex + 1] = g;
                            tempData[pixelStorageIndex + 2] = b;
                        }
                        pixelIndexSlice++;
                        if (pixelIndexSlice % size == 0) {
                            pixelIndexH++;
                            pixelIndexSlice = 0;
                            if (pixelIndexH % size == 0) {
                                pixelIndexW++;
                                pixelIndexH = 0;
                            }
                        }
                    }
                }
                if (tempData && data) {
                    for (var i = 0; i < tempData.length; i++) {
                        if (i > 0 && (i + 1) % 4 === 0) {
                            data[i] = 255;
                        }
                        else {
                            var value = tempData[i];
                            data[i] = (value / maxColor * 255);
                        }
                    }
                }
                if (texture.is3D) {
                    texture.updateSize(size, size, size);
                    engine.updateRawTexture3D(texture, data, LIB.Engine.TEXTUREFORMAT_RGBA, false);
                }
                else {
                    texture.updateSize(size * size, size);
                    engine.updateRawTexture(texture, data, LIB.Engine.TEXTUREFORMAT_RGBA, false);
                }
            };
            var scene = this.getScene();
            if (scene) {
                scene._loadFile(this.url, callback);
            }
            else {
                this._engine._loadFile(this.url, callback);
            }
            return this._texture;
        };
        /**
         * Starts the loading process of the texture.
         */
        ColorGradingTexture.prototype.loadTexture = function () {
            if (this.url && this.url.toLocaleLowerCase().indexOf(".3dl") == (this.url.length - 4)) {
                this.load3dlTexture();
            }
        };
        /**
         * Clones the color gradind texture.
         */
        ColorGradingTexture.prototype.clone = function () {
            var newTexture = new ColorGradingTexture(this.url, this.getScene());
            // Base texture
            newTexture.level = this.level;
            return newTexture;
        };
        /**
         * Called during delayed load for textures.
         */
        ColorGradingTexture.prototype.delayLoad = function () {
            if (this.delayLoadState !== LIB.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            this.delayLoadState = LIB.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, true);
            if (!this._texture) {
                this.loadTexture();
            }
        };
        /**
         * Parses a color grading texture serialized by LIB.
         * @param parsedTexture The texture information being parsedTexture
         * @param scene The scene to load the texture in
         * @param rootUrl The root url of the data assets to load
         * @return A color gradind texture
         */
        ColorGradingTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new ColorGradingTexture(parsedTexture.name, scene);
                texture.name = parsedTexture.name;
                texture.level = parsedTexture.level;
            }
            return texture;
        };
        /**
         * Serializes the LUT texture to json format.
         */
        ColorGradingTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.level = this.level;
            serializationObject.customType = "LIB.ColorGradingTexture";
            return serializationObject;
        };
        /**
         * Empty line regex stored for GC.
         */
        ColorGradingTexture._noneEmptyLineRegex = /\S+/;
        return ColorGradingTexture;
    }(LIB.BaseTexture));
    LIB.ColorGradingTexture = ColorGradingTexture;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.colorGradingTexture.js.map
//# sourceMappingURL=LIB.colorGradingTexture.js.map