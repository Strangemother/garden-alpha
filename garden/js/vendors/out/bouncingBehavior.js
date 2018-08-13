
var LIB;
(function (LIB) {
    /**
     * Add a bouncing effect to an ArcRotateCamera when reaching a specified minimum and maximum radius
     */
    var BouncingBehavior = /** @class */ (function () {
        function BouncingBehavior() {
            /**
             * The duration of the animation, in milliseconds
             */
            this.transitionDuration = 450;
            /**
             * Length of the distance animated by the transition when lower radius is reached
             */
            this.lowerRadiusTransitionRange = 2;
            /**
             * Length of the distance animated by the transition when upper radius is reached
             */
            this.upperRadiusTransitionRange = -2;
            this._autoTransitionRange = false;
            // Animations
            this._radiusIsAnimating = false;
            this._radiusBounceTransition = null;
            this._animatables = new Array();
        }
        Object.defineProperty(BouncingBehavior.prototype, "name", {
            get: function () {
                return "Bouncing";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BouncingBehavior.prototype, "autoTransitionRange", {
            /**
             * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
             */
            get: function () {
                return this._autoTransitionRange;
            },
            /**
             * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
             * Transition ranges will be set to 5% of the bounding box diagonal in world space
             */
            set: function (value) {
                var _this = this;
                if (this._autoTransitionRange === value) {
                    return;
                }
                this._autoTransitionRange = value;
                var camera = this._attachedCamera;
                if (!camera) {
                    return;
                }
                if (value) {
                    this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add(function (mesh) {
                        if (!mesh) {
                            return;
                        }
                        mesh.computeWorldMatrix(true);
                        var diagonal = mesh.getBoundingInfo().diagonalLength;
                        _this.lowerRadiusTransitionRange = diagonal * 0.05;
                        _this.upperRadiusTransitionRange = diagonal * 0.05;
                    });
                }
                else if (this._onMeshTargetChangedObserver) {
                    camera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
                }
            },
            enumerable: true,
            configurable: true
        });
        BouncingBehavior.prototype.init = function () {
            // Do notihng
        };
        BouncingBehavior.prototype.attach = function (camera) {
            var _this = this;
            this._attachedCamera = camera;
            this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(function () {
                if (!_this._attachedCamera) {
                    return;
                }
                // Add the bounce animation to the lower radius limit
                if (_this._isRadiusAtLimit(_this._attachedCamera.lowerRadiusLimit)) {
                    _this._applyBoundRadiusAnimation(_this.lowerRadiusTransitionRange);
                }
                // Add the bounce animation to the upper radius limit
                if (_this._isRadiusAtLimit(_this._attachedCamera.upperRadiusLimit)) {
                    _this._applyBoundRadiusAnimation(_this.upperRadiusTransitionRange);
                }
            });
        };
        BouncingBehavior.prototype.detach = function () {
            if (!this._attachedCamera) {
                return;
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
         * Checks if the camera radius is at the specified limit. Takes into account animation locks.
         * @param radiusLimit The limit to check against.
         * @return Bool to indicate if at limit.
         */
        BouncingBehavior.prototype._isRadiusAtLimit = function (radiusLimit) {
            if (!this._attachedCamera) {
                return false;
            }
            if (this._attachedCamera.radius === radiusLimit && !this._radiusIsAnimating) {
                return true;
            }
            return false;
        };
        /**
         * Applies an animation to the radius of the camera, extending by the radiusDelta.
         * @param radiusDelta The delta by which to animate to. Can be negative.
         */
        BouncingBehavior.prototype._applyBoundRadiusAnimation = function (radiusDelta) {
            var _this = this;
            if (!this._attachedCamera) {
                return;
            }
            if (!this._radiusBounceTransition) {
                BouncingBehavior.EasingFunction.setEasingMode(BouncingBehavior.EasingMode);
                this._radiusBounceTransition = LIB.Animation.CreateAnimation("radius", LIB.Animation.ANIMATIONTYPE_FLOAT, 60, BouncingBehavior.EasingFunction);
            }
            // Prevent zoom until bounce has completed
            this._cachedWheelPrecision = this._attachedCamera.wheelPrecision;
            this._attachedCamera.wheelPrecision = Infinity;
            this._attachedCamera.inertialRadiusOffset = 0;
            // Animate to the radius limit
            this.stopAllAnimations();
            this._radiusIsAnimating = true;
            var animatable = LIB.Animation.TransitionTo("radius", this._attachedCamera.radius + radiusDelta, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusBounceTransition, this.transitionDuration, function () { return _this._clearAnimationLocks(); });
            if (animatable) {
                this._animatables.push(animatable);
            }
        };
        /**
         * Removes all animation locks. Allows new animations to be added to any of the camera properties.
         */
        BouncingBehavior.prototype._clearAnimationLocks = function () {
            this._radiusIsAnimating = false;
            if (this._attachedCamera) {
                this._attachedCamera.wheelPrecision = this._cachedWheelPrecision;
            }
        };
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        BouncingBehavior.prototype.stopAllAnimations = function () {
            if (this._attachedCamera) {
                this._attachedCamera.animations = [];
            }
            while (this._animatables.length) {
                this._animatables[0].onAnimationEnd = null;
                this._animatables[0].stop();
                this._animatables.shift();
            }
        };
        /**
         * The easing function used by animations
         */
        BouncingBehavior.EasingFunction = new LIB.BackEase(0.3);
        /**
         * The easing mode used by animations
         */
        BouncingBehavior.EasingMode = LIB.EasingFunction.EASINGMODE_EASEOUT;
        return BouncingBehavior;
    }());
    LIB.BouncingBehavior = BouncingBehavior;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.bouncingBehavior.js.map
//# sourceMappingURL=LIB.bouncingBehavior.js.map
