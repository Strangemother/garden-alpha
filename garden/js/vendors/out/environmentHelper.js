var BABYLON;
(function (BABYLON) {
    /**
     * The Environment helper class can be used to add a fully featuread none expensive background to your scene.
     * It includes by default a skybox and a ground relying on the BackgroundMaterial.
     * It also helps with the default setup of your imageProcessing configuration.
     */
    var EnvironmentHelper = /** @class */ (function () {
        /**
         * constructor
         * @param options
         * @param scene The scene to add the material to
         */
        function EnvironmentHelper(options, scene) {
            this._options = __assign({}, EnvironmentHelper._getDefaultOptions(), options);
            this._scene = scene;
            this._setupBackground();
            this._setupImageProcessing();
        }
        /**
         * Creates the default options for the helper.
         */
        EnvironmentHelper._getDefaultOptions = function () {
            return {
                createGround: true,
                groundSize: 15,
                groundTexture: this._groundTextureCDNUrl,
                groundColor: new BABYLON.Color3(0.2, 0.2, 0.3).toLinearSpace().scale(3),
                groundOpacity: 0.9,
                enableGroundShadow: true,
                groundShadowLevel: 0.5,
                enableGroundMirror: false,
                groundMirrorSizeRatio: 0.3,
                groundMirrorBlurKernel: 64,
                groundMirrorAmount: 1,
                groundMirrorFresnelWeight: 1,
                groundMirrorFallOffDistance: 0,
                groundMirrorTextureType: BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT,
                createSkybox: true,
                skyboxSize: 20,
                skyboxTexture: this._skyboxTextureCDNUrl,
                skyboxColor: new BABYLON.Color3(0.2, 0.2, 0.3).toLinearSpace().scale(3),
                backgroundYRotation: 0,
                sizeAuto: true,
                rootPosition: BABYLON.Vector3.Zero(),
                setupImageProcessing: true,
                environmentTexture: this._environmentTextureCDNUrl,
                cameraExposure: 0.8,
                cameraContrast: 1.2,
                toneMappingEnabled: true,
            };
        };
        Object.defineProperty(EnvironmentHelper.prototype, "rootMesh", {
            /**
             * Gets the root mesh created by the helper.
             */
            get: function () {
                return this._rootMesh;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "skybox", {
            /**
             * Gets the skybox created by the helper.
             */
            get: function () {
                return this._skybox;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "skyboxTexture", {
            /**
             * Gets the skybox texture created by the helper.
             */
            get: function () {
                return this._skyboxTexture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "skyboxMaterial", {
            /**
             * Gets the skybox material created by the helper.
             */
            get: function () {
                return this._skyboxMaterial;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "ground", {
            /**
             * Gets the ground mesh created by the helper.
             */
            get: function () {
                return this._ground;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "groundTexture", {
            /**
             * Gets the ground texture created by the helper.
             */
            get: function () {
                return this._groundTexture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "groundMirror", {
            /**
             * Gets the ground mirror created by the helper.
             */
            get: function () {
                return this._groundMirror;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "groundMirrorRenderList", {
            /**
             * Gets the ground mirror render list to helps pushing the meshes
             * you wish in the ground reflection.
             */
            get: function () {
                if (this._groundMirror) {
                    return this._groundMirror.renderList;
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvironmentHelper.prototype, "groundMaterial", {
            /**
             * Gets the ground material created by the helper.
             */
            get: function () {
                return this._groundMaterial;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Updates the background according to the new options
         * @param options
         */
        EnvironmentHelper.prototype.updateOptions = function (options) {
            var newOptions = __assign({}, this._options, options);
            if (this._ground && !newOptions.createGround) {
                this._ground.dispose();
                this._ground = null;
            }
            if (this._groundMaterial && !newOptions.createGround) {
                this._groundMaterial.dispose();
                this._groundMaterial = null;
            }
            if (this._groundTexture) {
                if (this._options.groundTexture != newOptions.groundTexture) {
                    this._groundTexture.dispose();
                    this._groundTexture = null;
                }
            }
            if (this._skybox && !newOptions.createSkybox) {
                this._skybox.dispose();
                this._skybox = null;
            }
            if (this._skyboxMaterial && !newOptions.createSkybox) {
                this._skyboxMaterial.dispose();
                this._skyboxMaterial = null;
            }
            if (this._skyboxTexture) {
                if (this._options.skyboxTexture != newOptions.skyboxTexture) {
                    this._skyboxTexture.dispose();
                    this._skyboxTexture = null;
                }
            }
            if (this._groundMirror && !newOptions.enableGroundMirror) {
                this._groundMirror.dispose();
                this._groundMirror = null;
            }
            if (this._scene.environmentTexture) {
                if (this._options.environmentTexture != newOptions.environmentTexture) {
                    this._scene.environmentTexture.dispose();
                }
            }
            this._options = newOptions;
            this._setupBackground();
            this._setupImageProcessing();
        };
        /**
         * Sets the primary color of all the available elements.
         * @param color
         */
        EnvironmentHelper.prototype.setMainColor = function (color) {
            if (this.groundMaterial) {
                this.groundMaterial.primaryColor = color;
            }
            if (this.skyboxMaterial) {
                this.skyboxMaterial.primaryColor = color;
            }
            if (this.groundMirror) {
                this.groundMirror.clearColor = new BABYLON.Color4(color.r, color.g, color.b, 1.0);
            }
        };
        /**
         * Setup the image processing according to the specified options.
         */
        EnvironmentHelper.prototype._setupImageProcessing = function () {
            if (this._options.setupImageProcessing) {
                this._scene.imageProcessingConfiguration.contrast = this._options.cameraContrast;
                this._scene.imageProcessingConfiguration.exposure = this._options.cameraExposure;
                this._scene.imageProcessingConfiguration.toneMappingEnabled = this._options.toneMappingEnabled;
                this._setupEnvironmentTexture();
            }
        };
        /**
         * Setup the environment texture according to the specified options.
         */
        EnvironmentHelper.prototype._setupEnvironmentTexture = function () {
            if (this._scene.environmentTexture) {
                return;
            }
            if (this._options.environmentTexture instanceof BABYLON.BaseTexture) {
                this._scene.environmentTexture = this._options.environmentTexture;
                return;
            }
            var environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(this._options.environmentTexture, this._scene);
            this._scene.environmentTexture = environmentTexture;
        };
        /**
         * Setup the background according to the specified options.
         */
        EnvironmentHelper.prototype._setupBackground = function () {
            if (!this._rootMesh) {
                this._rootMesh = new BABYLON.Mesh("BackgroundHelper", this._scene);
            }
            this._rootMesh.rotation.y = this._options.backgroundYRotation;
            var sceneSize = this._getSceneSize();
            if (this._options.createGround) {
                this._setupGround(sceneSize);
                this._setupGroundMaterial();
                this._setupGroundDiffuseTexture();
                if (this._options.enableGroundMirror) {
                    this._setupGroundMirrorTexture(sceneSize);
                }
                this._setupMirrorInGroundMaterial();
            }
            if (this._options.createSkybox) {
                this._setupSkybox(sceneSize);
                this._setupSkyboxMaterial();
                this._setupSkyboxReflectionTexture();
            }
            this._rootMesh.position.x = sceneSize.rootPosition.x;
            this._rootMesh.position.z = sceneSize.rootPosition.z;
            this._rootMesh.position.y = sceneSize.rootPosition.y;
        };
        /**
         * Get the scene sizes according to the setup.
         */
        EnvironmentHelper.prototype._getSceneSize = function () {
            var groundSize = this._options.groundSize;
            var skyboxSize = this._options.skyboxSize;
            var rootPosition = this._options.rootPosition;
            if (!this._scene.meshes || this._scene.meshes.length === 1) {
                return { groundSize: groundSize, skyboxSize: skyboxSize, rootPosition: rootPosition };
            }
            var sceneExtends = this._scene.getWorldExtends();
            var sceneDiagonal = sceneExtends.max.subtract(sceneExtends.min);
            var bias = 0.0001;
            if (this._options.sizeAuto) {
                if (this._scene.activeCamera instanceof BABYLON.ArcRotateCamera &&
                    this._scene.activeCamera.upperRadiusLimit) {
                    groundSize = this._scene.activeCamera.upperRadiusLimit * 2;
                }
                if (this._scene.activeCamera) {
                    bias = (this._scene.activeCamera.maxZ - this._scene.activeCamera.minZ) / 10000;
                }
                var sceneDiagonalLenght = sceneDiagonal.length();
                if (sceneDiagonalLenght > groundSize) {
                    groundSize = sceneDiagonalLenght * 2;
                }
                // 10 % bigger.
                groundSize *= 1.1;
                skyboxSize *= 1.5;
                rootPosition = sceneExtends.min.add(sceneDiagonal.scale(0.5));
                rootPosition.y = sceneExtends.min.y - bias;
            }
            return { groundSize: groundSize, skyboxSize: skyboxSize, rootPosition: rootPosition };
        };
        /**
         * Setup the ground according to the specified options.
         */
        EnvironmentHelper.prototype._setupGround = function (sceneSize) {
            var _this = this;
            if (!this._ground) {
                this._ground = BABYLON.Mesh.CreatePlane("BackgroundPlane", sceneSize.groundSize, this._scene);
                this._ground.rotation.x = Math.PI / 2; // Face up by default.
                this._ground.parent = this._rootMesh;
                this._ground.onDisposeObservable.add(function () { _this._ground = null; });
            }
            this._ground.receiveShadows = this._options.enableGroundShadow;
        };
        /**
         * Setup the ground material according to the specified options.
         */
        EnvironmentHelper.prototype._setupGroundMaterial = function () {
            if (!this._groundMaterial) {
                this._groundMaterial = new BABYLON.BackgroundMaterial("BackgroundPlaneMaterial", this._scene);
            }
            this._groundMaterial.alpha = this._options.groundOpacity;
            this._groundMaterial.alphaMode = BABYLON.Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
            this._groundMaterial.shadowLevel = this._options.groundShadowLevel;
            this._groundMaterial.primaryLevel = 1;
            this._groundMaterial.primaryColor = this._options.groundColor;
            this._groundMaterial.secondaryLevel = 0;
            this._groundMaterial.tertiaryLevel = 0;
            this._groundMaterial.useRGBColor = false;
            this._groundMaterial.enableNoise = true;
            if (this._ground) {
                this._ground.material = this._groundMaterial;
            }
        };
        /**
         * Setup the ground diffuse texture according to the specified options.
         */
        EnvironmentHelper.prototype._setupGroundDiffuseTexture = function () {
            if (!this._groundMaterial) {
                return;
            }
            if (this._groundTexture) {
                return;
            }
            if (this._options.groundTexture instanceof BABYLON.BaseTexture) {
                this._groundMaterial.diffuseTexture = this._options.groundTexture;
                return;
            }
            var diffuseTexture = new BABYLON.Texture(this._options.groundTexture, this._scene);
            diffuseTexture.gammaSpace = false;
            diffuseTexture.hasAlpha = true;
            this._groundMaterial.diffuseTexture = diffuseTexture;
        };
        /**
         * Setup the ground mirror texture according to the specified options.
         */
        EnvironmentHelper.prototype._setupGroundMirrorTexture = function (sceneSize) {
            var wrapping = BABYLON.Texture.CLAMP_ADDRESSMODE;
            if (!this._groundMirror) {
                this._groundMirror = new BABYLON.MirrorTexture("BackgroundPlaneMirrorTexture", { ratio: this._options.groundMirrorSizeRatio }, this._scene, false, this._options.groundMirrorTextureType, BABYLON.Texture.BILINEAR_SAMPLINGMODE, true);
                this._groundMirror.mirrorPlane = new BABYLON.Plane(0, -1, 0, sceneSize.rootPosition.y);
                this._groundMirror.anisotropicFilteringLevel = 1;
                this._groundMirror.wrapU = wrapping;
                this._groundMirror.wrapV = wrapping;
                this._groundMirror.gammaSpace = false;
                if (this._groundMirror.renderList) {
                    for (var i = 0; i < this._scene.meshes.length; i++) {
                        var mesh = this._scene.meshes[i];
                        if (mesh !== this._ground &&
                            mesh !== this._skybox &&
                            mesh !== this._rootMesh) {
                            this._groundMirror.renderList.push(mesh);
                        }
                    }
                }
            }
            this._groundMirror.clearColor = new BABYLON.Color4(this._options.groundColor.r, this._options.groundColor.g, this._options.groundColor.b, 1);
            this._groundMirror.adaptiveBlurKernel = this._options.groundMirrorBlurKernel;
        };
        /**
         * Setup the ground to receive the mirror texture.
         */
        EnvironmentHelper.prototype._setupMirrorInGroundMaterial = function () {
            if (this._groundMaterial) {
                this._groundMaterial.reflectionTexture = this._groundMirror;
                this._groundMaterial.reflectionFresnel = true;
                this._groundMaterial.reflectionAmount = this._options.groundMirrorAmount;
                this._groundMaterial.reflectionStandardFresnelWeight = this._options.groundMirrorFresnelWeight;
                this._groundMaterial.reflectionFalloffDistance = this._options.groundMirrorFallOffDistance;
            }
        };
        /**
         * Setup the skybox according to the specified options.
         */
        EnvironmentHelper.prototype._setupSkybox = function (sceneSize) {
            var _this = this;
            if (!this._skybox) {
                this._skybox = BABYLON.Mesh.CreateCube("BackgroundSkybox", sceneSize.skyboxSize, this._scene, undefined, BABYLON.Mesh.BACKSIDE);
                this._skybox.onDisposeObservable.add(function () { _this._skybox = null; });
            }
            this._skybox.parent = this._rootMesh;
        };
        /**
         * Setup the skybox material according to the specified options.
         */
        EnvironmentHelper.prototype._setupSkyboxMaterial = function () {
            if (!this._skybox) {
                return;
            }
            if (!this._skyboxMaterial) {
                this._skyboxMaterial = new BABYLON.BackgroundMaterial("BackgroundSkyboxMaterial", this._scene);
            }
            this._skyboxMaterial.useRGBColor = false;
            this._skyboxMaterial.primaryLevel = 1;
            this._skyboxMaterial.primaryColor = this._options.skyboxColor;
            this._skyboxMaterial.secondaryLevel = 0;
            this._skyboxMaterial.tertiaryLevel = 0;
            this._skyboxMaterial.enableNoise = true;
            this._skybox.material = this._skyboxMaterial;
        };
        /**
         * Setup the skybox reflection texture according to the specified options.
         */
        EnvironmentHelper.prototype._setupSkyboxReflectionTexture = function () {
            if (!this._skyboxMaterial) {
                return;
            }
            if (this._skyboxTexture) {
                return;
            }
            if (this._options.skyboxTexture instanceof BABYLON.BaseTexture) {
                this._skyboxMaterial.reflectionTexture = this._skyboxTexture;
                return;
            }
            this._skyboxTexture = new BABYLON.CubeTexture(this._options.skyboxTexture, this._scene);
            this._skyboxTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._skyboxTexture.gammaSpace = false;
            this._skyboxMaterial.reflectionTexture = this._skyboxTexture;
        };
        /**
         * Dispose all the elements created by the Helper.
         */
        EnvironmentHelper.prototype.dispose = function () {
            if (this._groundMaterial) {
                this._groundMaterial.dispose(true, true);
            }
            if (this._skyboxMaterial) {
                this._skyboxMaterial.dispose(true, true);
            }
            this._rootMesh.dispose(false);
        };
        /**
         * Default ground texture URL.
         */
        EnvironmentHelper._groundTextureCDNUrl = "https://assets.babylonjs.com/environments/backgroundGround.png";
        /**
         * Default skybox texture URL.
         */
        EnvironmentHelper._skyboxTextureCDNUrl = "https://assets.babylonjs.com/environments/backgroundSkybox.dds";
        /**
         * Default environment texture URL.
         */
        EnvironmentHelper._environmentTextureCDNUrl = "https://assets.babylonjs.com/environments/environmentSpecular.dds";
        return EnvironmentHelper;
    }());
    BABYLON.EnvironmentHelper = EnvironmentHelper;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.environmentHelper.js.map
