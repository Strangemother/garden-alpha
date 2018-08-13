
var LIB;
(function (LIB) {
    var Animatable = /** @class */ (function () {
        function Animatable(scene, target, fromFrame, toFrame, loopAnimation, speedRatio, onAnimationEnd, animations) {
            if (fromFrame === void 0) { fromFrame = 0; }
            if (toFrame === void 0) { toFrame = 100; }
            if (loopAnimation === void 0) { loopAnimation = false; }
            if (speedRatio === void 0) { speedRatio = 1.0; }
            this.target = target;
            this.fromFrame = fromFrame;
            this.toFrame = toFrame;
            this.loopAnimation = loopAnimation;
            this.onAnimationEnd = onAnimationEnd;
            this._localDelayOffset = null;
            this._pausedDelay = null;
            this._runtimeAnimations = new Array();
            this._paused = false;
            this._speedRatio = 1;
            this._weight = -1.0;
            this.animationStarted = false;
            this._scene = scene;
            if (animations) {
                this.appendAnimations(target, animations);
            }
            this._speedRatio = speedRatio;
            scene._activeAnimatables.push(this);
        }
        Object.defineProperty(Animatable.prototype, "syncRoot", {
            /**
             * Gets the root Animatable used to synchronize and normalize animations
             */
            get: function () {
                return this._syncRoot;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animatable.prototype, "masterFrame", {
            /**
             * Gets the current frame of the first RuntimeAnimation
             * Used to synchronize Animatables
             */
            get: function () {
                if (this._runtimeAnimations.length === 0) {
                    return 0;
                }
                return this._runtimeAnimations[0].currentFrame;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animatable.prototype, "weight", {
            /**
             * Gets or sets the animatable weight (-1.0 by default meaning not weighted)
             */
            get: function () {
                return this._weight;
            },
            set: function (value) {
                if (value === -1) { // -1 is ok and means no weight
                    this._weight = -1;
                    return;
                }
                // Else weight must be in [0, 1] range
                this._weight = Math.min(Math.max(value, 0), 1.0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animatable.prototype, "speedRatio", {
            /**
             * Gets or sets the speed ratio to apply to the animatable (1.0 by default)
             */
            get: function () {
                return this._speedRatio;
            },
            set: function (value) {
                for (var index = 0; index < this._runtimeAnimations.length; index++) {
                    var animation = this._runtimeAnimations[index];
                    animation._prepareForSpeedRatioChange(value);
                }
                this._speedRatio = value;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        /**
         * Synchronize and normalize current Animatable with a source Animatable
         * This is useful when using animation weights and when animations are not of the same length
         * @param root defines the root Animatable to synchronize with
         * @returns the current Animatable
         */
        Animatable.prototype.syncWith = function (root) {
            this._syncRoot = root;
            if (root) {
                // Make sure this animatable will animate after the root
                var index = this._scene._activeAnimatables.indexOf(this);
                if (index > -1) {
                    this._scene._activeAnimatables.splice(index, 1);
                    this._scene._activeAnimatables.push(this);
                }
            }
            return this;
        };
        Animatable.prototype.getAnimations = function () {
            return this._runtimeAnimations;
        };
        Animatable.prototype.appendAnimations = function (target, animations) {
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];
                this._runtimeAnimations.push(new LIB.RuntimeAnimation(target, animation, this._scene, this));
            }
        };
        Animatable.prototype.getAnimationByTargetProperty = function (property) {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                if (runtimeAnimations[index].animation.targetProperty === property) {
                    return runtimeAnimations[index].animation;
                }
            }
            return null;
        };
        Animatable.prototype.getRuntimeAnimationByTargetProperty = function (property) {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                if (runtimeAnimations[index].animation.targetProperty === property) {
                    return runtimeAnimations[index];
                }
            }
            return null;
        };
        Animatable.prototype.reset = function () {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].reset(true);
            }
            this._localDelayOffset = null;
            this._pausedDelay = null;
        };
        Animatable.prototype.enableBlending = function (blendingSpeed) {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].animation.enableBlending = true;
                runtimeAnimations[index].animation.blendingSpeed = blendingSpeed;
            }
        };
        Animatable.prototype.disableBlending = function () {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].animation.enableBlending = false;
            }
        };
        Animatable.prototype.goToFrame = function (frame) {
            var runtimeAnimations = this._runtimeAnimations;
            if (runtimeAnimations[0]) {
                var fps = runtimeAnimations[0].animation.framePerSecond;
                var currentFrame = runtimeAnimations[0].currentFrame;
                var adjustTime = frame - currentFrame;
                var delay = adjustTime * 1000 / (fps * this.speedRatio);
                if (this._localDelayOffset === null) {
                    this._localDelayOffset = 0;
                }
                this._localDelayOffset -= delay;
            }
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].goToFrame(frame);
            }
        };
        Animatable.prototype.pause = function () {
            if (this._paused) {
                return;
            }
            this._paused = true;
        };
        Animatable.prototype.restart = function () {
            this._paused = false;
        };
        Animatable.prototype.stop = function (animationName) {
            if (animationName) {
                var idx = this._scene._activeAnimatables.indexOf(this);
                if (idx > -1) {
                    var runtimeAnimations = this._runtimeAnimations;
                    for (var index = runtimeAnimations.length - 1; index >= 0; index--) {
                        if (typeof animationName === "string" && runtimeAnimations[index].animation.name != animationName) {
                            continue;
                        }
                        runtimeAnimations[index].dispose();
                        runtimeAnimations.splice(index, 1);
                    }
                    if (runtimeAnimations.length == 0) {
                        this._scene._activeAnimatables.splice(idx, 1);
                        if (this.onAnimationEnd) {
                            this.onAnimationEnd();
                        }
                    }
                }
            }
            else {
                var index = this._scene._activeAnimatables.indexOf(this);
                if (index > -1) {
                    this._scene._activeAnimatables.splice(index, 1);
                    var runtimeAnimations = this._runtimeAnimations;
                    for (var index = 0; index < runtimeAnimations.length; index++) {
                        runtimeAnimations[index].dispose();
                    }
                    if (this.onAnimationEnd) {
                        this.onAnimationEnd();
                    }
                }
            }
        };
        Animatable.prototype._animate = function (delay) {
            if (this._paused) {
                this.animationStarted = false;
                if (this._pausedDelay === null) {
                    this._pausedDelay = delay;
                }
                return true;
            }
            if (this._localDelayOffset === null) {
                this._localDelayOffset = delay;
                this._pausedDelay = null;
            }
            else if (this._pausedDelay !== null) {
                this._localDelayOffset += delay - this._pausedDelay;
                this._pausedDelay = null;
            }
            if (this._weight === 0) { // We consider that an animation with a weight === 0 is "actively" paused
                return true;
            }
            // Animating
            var running = false;
            var runtimeAnimations = this._runtimeAnimations;
            var index;
            for (index = 0; index < runtimeAnimations.length; index++) {
                var animation = runtimeAnimations[index];
                var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this._speedRatio, this._weight);
                running = running || isRunning;
            }
            this.animationStarted = running;
            if (!running) {
                // Remove from active animatables
                index = this._scene._activeAnimatables.indexOf(this);
                this._scene._activeAnimatables.splice(index, 1);
                // Dispose all runtime animations
                for (index = 0; index < runtimeAnimations.length; index++) {
                    runtimeAnimations[index].dispose();
                }
            }
            if (!running && this.onAnimationEnd) {
                this.onAnimationEnd();
                this.onAnimationEnd = null;
            }
            return running;
        };
        return Animatable;
    }());
    LIB.Animatable = Animatable;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.animatable.js.map
//# sourceMappingURL=LIB.animatable.js.map
