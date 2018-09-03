






var LIB;
(function (LIB) {
    /**
     * A spot light is defined by a position, a direction, an angle, and an exponent.
     * These values define a cone of light starting from the position, emitting toward the direction.
     * The angle, in radians, defines the size (field of illumination) of the spotlight's conical beam,
     * and the exponent defines the speed of the decay of the light with distance (reach).
     * Documentation: https://doc.LIBjs.com/LIB101/lights
     */
    var SpotLight = /** @class */ (function (_super) {
        __extends(SpotLight, _super);
        /**
         * Creates a SpotLight object in the scene. A spot light is a simply light oriented cone.
         * It can cast shadows.
         * Documentation : http://doc.LIBjs.com/tutorials/lights
         * @param name The light friendly name
         * @param position The position of the spot light in the scene
         * @param direction The direction of the light in the scene
         * @param angle The cone angle of the light in Radians
         * @param exponent The light decay speed with the distance from the emission spot
         * @param scene The scene the lights belongs to
         */
        function SpotLight(name, position, direction, angle, exponent, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._projectionTextureMatrix = LIB.Matrix.Zero();
            _this._projectionTextureLightNear = 1e-6;
            _this._projectionTextureLightFar = 1000.0;
            _this._projectionTextureUpDirection = LIB.Vector3.Up();
            _this._projectionTextureViewLightDirty = true;
            _this._projectionTextureProjectionLightDirty = true;
            _this._projectionTextureDirty = true;
            _this._projectionTextureViewTargetVector = LIB.Vector3.Zero();
            _this._projectionTextureViewLightMatrix = LIB.Matrix.Zero();
            _this._projectionTextureProjectionLightMatrix = LIB.Matrix.Zero();
            _this._projectionTextureScalingMatrix = LIB.Matrix.FromValues(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
            _this.position = position;
            _this.direction = direction;
            _this.angle = angle;
            _this.exponent = exponent;
            return _this;
        }
        Object.defineProperty(SpotLight.prototype, "angle", {
            /**
             * Gets the cone angle of the spot light in Radians.
             */
            get: function () {
                return this._angle;
            },
            /**
             * Sets the cone angle of the spot light in Radians.
             */
            set: function (value) {
                this._angle = value;
                this._projectionTextureProjectionLightDirty = true;
                this.forceProjectionMatrixCompute();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpotLight.prototype, "shadowAngleScale", {
            /**
             * Allows scaling the angle of the light for shadow generation only.
             */
            get: function () {
                return this._shadowAngleScale;
            },
            /**
             * Allows scaling the angle of the light for shadow generation only.
             */
            set: function (value) {
                this._shadowAngleScale = value;
                this.forceProjectionMatrixCompute();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpotLight.prototype, "projectionTextureMatrix", {
            /**
            * Allows reading the projecton texture
            */
            get: function () {
                return this._projectionTextureMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpotLight.prototype, "projectionTextureLightNear", {
            /**
             * Gets the near clip of the Spotlight for texture projection.
             */
            get: function () {
                return this._projectionTextureLightNear;
            },
            /**
             * Sets the near clip of the Spotlight for texture projection.
             */
            set: function (value) {
                this._projectionTextureLightNear = value;
                this._projectionTextureProjectionLightDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpotLight.prototype, "projectionTextureLightFar", {
            /**
             * Gets the far clip of the Spotlight for texture projection.
             */
            get: function () {
                return this._projectionTextureLightFar;
            },
            /**
             * Sets the far clip of the Spotlight for texture projection.
             */
            set: function (value) {
                this._projectionTextureLightFar = value;
                this._projectionTextureProjectionLightDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpotLight.prototype, "projectionTextureUpDirection", {
            /**
             * Gets the Up vector of the Spotlight for texture projection.
             */
            get: function () {
                return this._projectionTextureUpDirection;
            },
            /**
             * Sets the Up vector of the Spotlight for texture projection.
             */
            set: function (value) {
                this._projectionTextureUpDirection = value;
                this._projectionTextureProjectionLightDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpotLight.prototype, "projectionTexture", {
            /**
             * Gets the projection texture of the light.
            */
            get: function () {
                return this._projectionTexture;
            },
            /**
            * Sets the projection texture of the light.
            */
            set: function (value) {
                this._projectionTexture = value;
                this._projectionTextureDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the string "SpotLight".
         * @returns the class name
         */
        SpotLight.prototype.getClassName = function () {
            return "SpotLight";
        };
        /**
         * Returns the integer 2.
         * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
         */
        SpotLight.prototype.getTypeID = function () {
            return LIB.Light.LIGHTTYPEID_SPOTLIGHT;
        };
        /**
         * Overrides the direction setter to recompute the projection texture view light Matrix.
         */
        SpotLight.prototype._setDirection = function (value) {
            _super.prototype._setDirection.call(this, value);
            this._projectionTextureViewLightDirty = true;
        };
        /**
         * Overrides the position setter to recompute the projection texture view light Matrix.
         */
        SpotLight.prototype._setPosition = function (value) {
            _super.prototype._setPosition.call(this, value);
            this._projectionTextureViewLightDirty = true;
        };
        /**
         * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.
         * Returns the SpotLight.
         */
        SpotLight.prototype._setDefaultShadowProjectionMatrix = function (matrix, viewMatrix, renderList) {
            var activeCamera = this.getScene().activeCamera;
            if (!activeCamera) {
                return;
            }
            this._shadowAngleScale = this._shadowAngleScale || 1;
            var angle = this._shadowAngleScale * this._angle;
            LIB.Matrix.PerspectiveFovLHToRef(angle, 1.0, this.getDepthMinZ(activeCamera), this.getDepthMaxZ(activeCamera), matrix);
        };
        SpotLight.prototype._computeProjectionTextureViewLightMatrix = function () {
            this._projectionTextureViewLightDirty = false;
            this._projectionTextureDirty = true;
            this.position.addToRef(this.direction, this._projectionTextureViewTargetVector);
            LIB.Matrix.LookAtLHToRef(this.position, this._projectionTextureViewTargetVector, this._projectionTextureUpDirection, this._projectionTextureViewLightMatrix);
        };
        SpotLight.prototype._computeProjectionTextureProjectionLightMatrix = function () {
            this._projectionTextureProjectionLightDirty = false;
            this._projectionTextureDirty = true;
            var light_far = this.projectionTextureLightFar;
            var light_near = this.projectionTextureLightNear;
            var P = light_far / (light_far - light_near);
            var Q = -P * light_near;
            var S = 1.0 / Math.tan(this._angle / 2.0);
            var A = 1.0;
            LIB.Matrix.FromValuesToRef(S / A, 0.0, 0.0, 0.0, 0.0, S, 0.0, 0.0, 0.0, 0.0, P, 1.0, 0.0, 0.0, Q, 0.0, this._projectionTextureProjectionLightMatrix);
        };
        /**
         * Main function for light texture projection matrix computing.
         */
        SpotLight.prototype._computeProjectionTextureMatrix = function () {
            this._projectionTextureDirty = false;
            this._projectionTextureViewLightMatrix.multiplyToRef(this._projectionTextureProjectionLightMatrix, this._projectionTextureMatrix);
            this._projectionTextureMatrix.multiplyToRef(this._projectionTextureScalingMatrix, this._projectionTextureMatrix);
        };
        SpotLight.prototype._buildUniformLayout = function () {
            this._uniformBuffer.addUniform("vLightData", 4);
            this._uniformBuffer.addUniform("vLightDiffuse", 4);
            this._uniformBuffer.addUniform("vLightSpecular", 3);
            this._uniformBuffer.addUniform("vLightDirection", 3);
            this._uniformBuffer.addUniform("shadowsInfo", 3);
            this._uniformBuffer.addUniform("depthValues", 2);
            this._uniformBuffer.create();
        };
        /**
         * Sets the passed Effect object with the SpotLight transfomed position (or position if not parented) and normalized direction.
         * @param effect The effect to update
         * @param lightIndex The index of the light in the effect to update
         * @returns The spot light
         */
        SpotLight.prototype.transferToEffect = function (effect, lightIndex) {
            var normalizeDirection;
            if (this.computeTransformedInformation()) {
                this._uniformBuffer.updateFloat4("vLightData", this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, this.exponent, lightIndex);
                normalizeDirection = LIB.Vector3.Normalize(this.transformedDirection);
            }
            else {
                this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, this.exponent, lightIndex);
                normalizeDirection = LIB.Vector3.Normalize(this.direction);
            }
            this._uniformBuffer.updateFloat4("vLightDirection", normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(this.angle * 0.5), lightIndex);
            if (this.projectionTexture && this.projectionTexture.isReady()) {
                if (this._projectionTextureViewLightDirty) {
                    this._computeProjectionTextureViewLightMatrix();
                }
                if (this._projectionTextureProjectionLightDirty) {
                    this._computeProjectionTextureProjectionLightMatrix();
                }
                if (this._projectionTextureDirty) {
                    this._computeProjectionTextureMatrix();
                }
                effect.setMatrix("textureProjectionMatrix" + lightIndex, this._projectionTextureMatrix);
                effect.setTexture("projectionLightSampler" + lightIndex, this.projectionTexture);
            }
            return this;
        };
        /**
         * Disposes the light and the associated resources.
         */
        SpotLight.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            if (this._projectionTexture) {
                this._projectionTexture.dispose();
            }
        };
        __decorate([
            LIB.serialize()
        ], SpotLight.prototype, "angle", null);
        __decorate([
            LIB.serialize()
        ], SpotLight.prototype, "shadowAngleScale", null);
        __decorate([
            LIB.serialize()
        ], SpotLight.prototype, "exponent", void 0);
        __decorate([
            LIB.serialize()
        ], SpotLight.prototype, "projectionTextureLightNear", null);
        __decorate([
            LIB.serialize()
        ], SpotLight.prototype, "projectionTextureLightFar", null);
        __decorate([
            LIB.serialize()
        ], SpotLight.prototype, "projectionTextureUpDirection", null);
        __decorate([
            LIB.serializeAsTexture("projectedLightTexture")
        ], SpotLight.prototype, "_projectionTexture", void 0);
        return SpotLight;
    }(LIB.ShadowLight));
    LIB.SpotLight = SpotLight;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.spotLight.js.map
//# sourceMappingURL=LIB.spotLight.js.map