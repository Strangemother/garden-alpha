
var LIB;
(function (LIB) {
    var FramingBehavior = /** @class */ (function () {
        function FramingBehavior() {
            this._mode = FramingBehavior.FitFrustumSidesMode;
            this._radiusScale = 1.0;
            this._positionScale = 0.5;
            this._defaultElevation = 0.3;
            this._elevationReturnTime = 1500;
            this._elevationReturnWaitTime = 1000;
            this._zoomStopsAnimation = false;
            this._framingTime = 1500;
            this._isPointerDown = false;
            this._lastInteractionTime = -Infinity;
            // Framing control
            this._animatables = new Array();
            this._betaIsAnimating = false;
        }
        Object.defineProperty(FramingBehavior.prototype, "name", {
            get: function () {
                return "Framing";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "mode", {
            /**
             * Gets current mode used by the behavior.
             */
            get: function () {
                return this._mode;
            },
            /**
             * Sets the current mode used by the behavior
             */
            set: function (mode) {
                this._mode = mode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "radiusScale", {
            /**
             * Gets the scale applied to the radius
             */
            get: function () {
                return this._radiusScale;
            },
            /**
             * Sets the scale applied to the radius (1 by default)
             */
            set: function (radius) {
                this._radiusScale = radius;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "positionScale", {
            /**
             * Gets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
             */
            get: function () {
                return this._positionScale;
            },
            /**
             * Sets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
             */
            set: function (scale) {
                this._positionScale = scale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "defaultElevation", {
            /**
            * Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
            * behaviour is triggered, in radians.
            */
            get: function () {
                return this._defaultElevation;
            },
            /**
            * Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
            * behaviour is triggered, in radians.
            */
            set: function (elevation) {
                this._defaultElevation = elevation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "elevationReturnTime", {
            /**
             * Gets the time (in milliseconds) taken to return to the default beta position.
             * Negative value indicates camera should not return to default.
             */
            get: function () {
                return this._elevationReturnTime;
            },
            /**
             * Sets the time (in milliseconds) taken to return to the default beta position.
             * Negative value indicates camera should not return to default.
             */
            set: function (speed) {
                this._elevationReturnTime = speed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "elevationReturnWaitTime", {
            /**
             * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
             */
            get: function () {
                return this._elevationReturnWaitTime;
            },
            /**
             * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
             */
            set: function (time) {
                this._elevationReturnWaitTime = time;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "zoomStopsAnimation", {
            /**
            * Gets the flag that indicates if user zooming should stop animation.
            */
            get: function () {
                return this._zoomStopsAnimation;
            },
            /**
            * Sets the flag that indicates if user zooming should stop animation.
            */
            set: function (flag) {
                this._zoomStopsAnimation = flag;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "framingTime", {
            /**
             * Gets the transition time when framing the mesh, in milliseconds
            */
            get: function () {
                return this._framingTime;
            },
            /**
             * Sets the transition time when framing the mesh, in milliseconds
            */
            set: function (time) {
                this._framingTime = time;
            },
            enumerable: true,
            configurable: true
        });
        FramingBehavior.prototype.init = function () {
            // Do notihng
        };
        FramingBehavior.prototype.attach = function (camera) {
            var _this = this;
            this._attachedCamera = camera;
            var scene = this._attachedCamera.getScene();
            FramingBehavior.EasingFunction.setEasingMode(FramingBehavior.EasingMode);
            this._onPrePointerObservableObserver = scene.onPrePointerObservable.add(function (pointerInfoPre) {
                if (pointerInfoPre.type === LIB.PointerEventTypes.POINTERDOWN) {
                    _this._isPointerDown = true;
                    return;
                }
                if (pointerInfoPre.type === LIB.PointerEventTypes.POINTERUP) {
                    _this._isPointerDown = false;
                }
            });
            this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add(function (mesh) {
                if (mesh) {
                    _this.zoomOnMesh(mesh);
                }
            });
            this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(function () {
                // Stop the animation if there is user interaction and the animation should stop for this interaction
                _this._applyUserInteraction();
                // Maintain the camera above the ground. If the user pulls the camera beneath the ground plane, lift it
                // back to the default position after a given timeout
                _this._maintainCameraAboveGround();
            });
        };
        FramingBehavior.prototype.detach = function () {
            if (!this._attachedCamera) {
                return;
            }
            var scene = this._attachedCamera.getScene();
            if (this._onPrePointerObservableObserver) {
                scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
            }
            if (this._onAfterCheckInputsObserver) {
                this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
            }
            if (this._onMeshTargetChangedObserver) {
                this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
            }
            this._attachedCamera = null;
        };
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnMesh = function (mesh, focusOnOriginXZ, onAnimationEnd) {
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            mesh.computeWorldMatrix(true);
            var boundingBox = mesh.getBoundingInfo().boundingBox;
            this.zoomOnBoundingInfo(boundingBox.minimumWorld, boundingBox.maximumWorld, focusOnOriginXZ, onAnimationEnd);
        };
        /**
         * Targets the given mesh with its children and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnMeshHierarchy = function (mesh, focusOnOriginXZ, onAnimationEnd) {
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            mesh.computeWorldMatrix(true);
            var boundingBox = mesh.getHierarchyBoundingVectors(true);
            this.zoomOnBoundingInfo(boundingBox.min, boundingBox.max, focusOnOriginXZ, onAnimationEnd);
        };
        /**
         * Targets the given meshes with their children and updates zoom level accordingly.
         * @param meshes  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnMeshesHierarchy = function (meshes, focusOnOriginXZ, onAnimationEnd) {
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            var min = new LIB.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new LIB.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var i = 0; i < meshes.length; i++) {
                var boundingInfo = meshes[i].getHierarchyBoundingVectors(true);
                LIB.Tools.CheckExtends(boundingInfo.min, min, max);
                LIB.Tools.CheckExtends(boundingInfo.max, min, max);
            }
            this.zoomOnBoundingInfo(min, max, focusOnOriginXZ, onAnimationEnd);
        };
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnBoundingInfo = function (minimumWorld, maximumWorld, focusOnOriginXZ, onAnimationEnd) {
            var _this = this;
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            var zoomTarget;
            if (!this._attachedCamera) {
                return;
            }
            // Find target by interpolating from bottom of bounding box in world-space to top via framingPositionY
            var bottom = minimumWorld.y;
            var top = maximumWorld.y;
            var zoomTargetY = bottom + (top - bottom) * this._positionScale;
            var radiusWorld = maximumWorld.subtract(minimumWorld).scale(0.5);
            if (focusOnOriginXZ) {
                zoomTarget = new LIB.Vector3(0, zoomTargetY, 0);
            }
            else {
                var centerWorld = minimumWorld.add(radiusWorld);
                zoomTarget = new LIB.Vector3(centerWorld.x, zoomTargetY, centerWorld.z);
            }
            if (!this._vectorTransition) {
                this._vectorTransition = LIB.Animation.CreateAnimation("target", LIB.Animation.ANIMATIONTYPE_VECTOR3, 60, FramingBehavior.EasingFunction);
            }
            this._betaIsAnimating = true;
            var animatable = LIB.Animation.TransitionTo("target", zoomTarget, this._attachedCamera, this._attachedCamera.getScene(), 60, this._vectorTransition, this._framingTime);
            if (animatable) {
                this._animatables.push(animatable);
            }
            // sets the radius and lower radius bounds
            // Small delta ensures camera is not always at lower zoom limit.
            var radius = 0;
            if (this._mode === FramingBehavior.FitFrustumSidesMode) {
                var position = this._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld);
                this._attachedCamera.lowerRadiusLimit = radiusWorld.length() + this._attachedCamera.minZ;
                radius = position;
            }
            else if (this._mode === FramingBehavior.IgnoreBoundsSizeMode) {
                radius = this._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld);
                if (this._attachedCamera.lowerRadiusLimit === null) {
                    this._attachedCamera.lowerRadiusLimit = this._attachedCamera.minZ;
                }
            }
            // Set sensibilities
            var extend = maximumWorld.subtract(minimumWorld).length();
            this._attachedCamera.panningSensibility = 5000 / extend;
            this._attachedCamera.wheelPrecision = 100 / radius;
            // transition to new radius
            if (!this._radiusTransition) {
                this._radiusTransition = LIB.Animation.CreateAnimation("radius", LIB.Animation.ANIMATIONTYPE_FLOAT, 60, FramingBehavior.EasingFunction);
            }
            animatable = LIB.Animation.TransitionTo("radius", radius, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusTransition, this._framingTime, function () {
                _this.stopAllAnimations();
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
                if (_this._attachedCamera) {
                    _this._attachedCamera.storeState();
                }
            });
            if (animatable) {
                this._animatables.push(animatable);
            }
        };
        /**
         * Calculates the lowest radius for the camera based on the bounding box of the mesh.
         * @param mesh The mesh on which to base the calculation. mesh boundingInfo used to estimate necessary
         *			  frustum width.
         * @return The minimum distance from the primary mesh's center point at which the camera must be kept in order
         *		 to fully enclose the mesh in the viewing frustum.
         */
        FramingBehavior.prototype._calculateLowerRadiusFromModelBoundingSphere = function (minimumWorld, maximumWorld) {
            var size = maximumWorld.subtract(minimumWorld);
            var boxVectorGlobalDiagonal = size.length();
            var frustumSlope = this._getFrustumSlope();
            // Formula for setting distance
            // (Good explanation: http://stackoverflow.com/questions/2866350/move-camera-to-fit-3d-scene)
            var radiusWithoutFraming = boxVectorGlobalDiagonal * 0.5;
            // Horizon distance
            var radius = radiusWithoutFraming * this._radiusScale;
            var distanceForHorizontalFrustum = radius * Math.sqrt(1.0 + 1.0 / (frustumSlope.x * frustumSlope.x));
            var distanceForVerticalFrustum = radius * Math.sqrt(1.0 + 1.0 / (frustumSlope.y * frustumSlope.y));
            var distance = Math.max(distanceForHorizontalFrustum, distanceForVerticalFrustum);
            var camera = this._attachedCamera;
            if (!camera) {
                return 0;
            }
            if (camera.lowerRadiusLimit && this._mode === FramingBehavior.IgnoreBoundsSizeMode) {
                // Don't exceed the requested limit
                distance = distance < camera.lowerRadiusLimit ? camera.lowerRadiusLimit : distance;
            }
            // Don't exceed the upper radius limit
            if (camera.upperRadiusLimit) {
                distance = distance > camera.upperRadiusLimit ? camera.upperRadiusLimit : distance;
            }
            return distance;
        };
        /**
         * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
         * is automatically returned to its default position (expected to be above ground plane).
         */
        FramingBehavior.prototype._maintainCameraAboveGround = function () {
            var _this = this;
            if (this._elevationReturnTime < 0) {
                return;
            }
            var timeSinceInteraction = LIB.Tools.Now - this._lastInteractionTime;
            var defaultBeta = Math.PI * 0.5 - this._defaultElevation;
            var limitBeta = Math.PI * 0.5;
            // Bring the camera back up if below the ground plane
            if (this._attachedCamera && !this._betaIsAnimating && this._attachedCamera.beta > limitBeta && timeSinceInteraction >= this._elevationReturnWaitTime) {
                this._betaIsAnimating = true;
                //Transition to new position
                this.stopAllAnimations();
                if (!this._betaTransition) {
                    this._betaTransition = LIB.Animation.CreateAnimation("beta", LIB.Animation.ANIMATIONTYPE_FLOAT, 60, FramingBehavior.EasingFunction);
                }
                var animatabe = LIB.Animation.TransitionTo("beta", defaultBeta, this._attachedCamera, this._attachedCamera.getScene(), 60, this._betaTransition, this._elevationReturnTime, function () {
                    _this._clearAnimationLocks();
                    _this.stopAllAnimations();
                });
                if (animatabe) {
                    this._animatables.push(animatabe);
                }
            }
        };
        /**
         * Returns the frustum slope based on the canvas ratio and camera FOV
         * @returns The frustum slope represented as a Vector2 with X and Y slopes
         */
        FramingBehavior.prototype._getFrustumSlope = function () {
            // Calculate the viewport ratio
            // Aspect Ratio is Height/Width.
            var camera = this._attachedCamera;
            if (!camera) {
                return LIB.Vector2.Zero();
            }
            var engine = camera.getScene().getEngine();
            var aspectRatio = engine.getAspectRatio(camera);
            // Camera FOV is the vertical field of view (top-bottom) in radians.
            // Slope of the frustum top/bottom planes in view space, relative to the forward vector.
            var frustumSlopeY = Math.tan(camera.fov / 2);
            // Slope of the frustum left/right planes in view space, relative to the forward vector.
            // Provides the amount that one side (e.g. left) of the frustum gets wider for every unit
            // along the forward vector.
            var frustumSlopeX = frustumSlopeY * aspectRatio;
            return new LIB.Vector2(frustumSlopeX, frustumSlopeY);
        };
        /**
         * Removes all animation locks. Allows new animations to be added to any of the arcCamera properties.
         */
        FramingBehavior.prototype._clearAnimationLocks = function () {
            this._betaIsAnimating = false;
        };
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        FramingBehavior.prototype._applyUserInteraction = function () {
            if (this.isUserIsMoving) {
                this._lastInteractionTime = LIB.Tools.Now;
                this.stopAllAnimations();
                this._clearAnimationLocks();
            }
        };
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        FramingBehavior.prototype.stopAllAnimations = function () {
            if (this._attachedCamera) {
                this._attachedCamera.animations = [];
            }
            while (this._animatables.length) {
                if (this._animatables[0]) {
                    this._animatables[0].onAnimationEnd = null;
                    this._animatables[0].stop();
                }
                this._animatables.shift();
            }
        };
        Object.defineProperty(FramingBehavior.prototype, "isUserIsMoving", {
            /**
             * Gets a value indicating if the user is moving the camera
             */
            get: function () {
                if (!this._attachedCamera) {
                    return false;
                }
                return this._attachedCamera.inertialAlphaOffset !== 0 ||
                    this._attachedCamera.inertialBetaOffset !== 0 ||
                    this._attachedCamera.inertialRadiusOffset !== 0 ||
                    this._attachedCamera.inertialPanningX !== 0 ||
                    this._attachedCamera.inertialPanningY !== 0 ||
                    this._isPointerDown;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * The easing function used by animations
         */
        FramingBehavior.EasingFunction = new LIB.ExponentialEase();
        /**
         * The easing mode used by animations
         */
        FramingBehavior.EasingMode = LIB.EasingFunction.EASINGMODE_EASEINOUT;
        // Statics
        /**
         * The camera can move all the way towards the mesh.
         */
        FramingBehavior.IgnoreBoundsSizeMode = 0;
        /**
         * The camera is not allowed to zoom closer to the mesh than the point at which the adjusted bounding sphere touches the frustum sides
         */
        FramingBehavior.FitFrustumSidesMode = 1;
        return FramingBehavior;
    }());
    LIB.FramingBehavior = FramingBehavior;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.framingBehavior.js.map
//# sourceMappingURL=LIB.framingBehavior.js.map