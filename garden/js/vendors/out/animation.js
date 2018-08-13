
var LIB;
(function (LIB) {
    /**
     * Represents the range of an animation
     */
    var AnimationRange = /** @class */ (function () {
        /**
         * Initializes the range of an animation
         * @param name The name of the animation range
         * @param from The starting frame of the animation
         * @param to The ending frame of the animation
         */
        function AnimationRange(
        /**The name of the animation range**/
        name, 
        /**The starting frame of the animation */
        from, 
        /**The ending frame of the animation*/
        to) {
            this.name = name;
            this.from = from;
            this.to = to;
        }
        /**
         * Makes a copy of the animation range
         * @returns A copy of the animation range
         */
        AnimationRange.prototype.clone = function () {
            return new AnimationRange(this.name, this.from, this.to);
        };
        return AnimationRange;
    }());
    LIB.AnimationRange = AnimationRange;
    /**
     * Composed of a frame, and an action function
     */
    var AnimationEvent = /** @class */ (function () {
        /**
         * Initializes the animation event
         * @param frame The frame for which the event is triggered
         * @param action The event to perform when triggered
         * @param onlyOnce Specifies if the event should be triggered only once
         */
        function AnimationEvent(
        /** The frame for which the event is triggered **/
        frame, 
        /** The event to perform when triggered **/
        action, 
        /** Specifies if the event should be triggered only once**/
        onlyOnce) {
            this.frame = frame;
            this.action = action;
            this.onlyOnce = onlyOnce;
            /**
             * Specifies if the animation event is done
             */
            this.isDone = false;
        }
        return AnimationEvent;
    }());
    LIB.AnimationEvent = AnimationEvent;
    /**
     * A cursor which tracks a point on a path
     */
    var PathCursor = /** @class */ (function () {
        /**
         * Initializes the path cursor
         * @param path The path to track
         */
        function PathCursor(path) {
            this.path = path;
            /**
             * Stores path cursor callbacks for when an onchange event is triggered
             */
            this._onchange = new Array();
            /**
             * The value of the path cursor
             */
            this.value = 0;
            /**
             * The animation array of the path cursor
             */
            this.animations = new Array();
        }
        /**
         * Gets the cursor point on the path
         * @returns A point on the path cursor at the cursor location
         */
        PathCursor.prototype.getPoint = function () {
            var point = this.path.getPointAtLengthPosition(this.value);
            return new LIB.Vector3(point.x, 0, point.y);
        };
        /**
         * Moves the cursor ahead by the step amount
         * @param step The amount to move the cursor forward
         * @returns This path cursor
         */
        PathCursor.prototype.moveAhead = function (step) {
            if (step === void 0) { step = 0.002; }
            this.move(step);
            return this;
        };
        /**
         * Moves the cursor behind by the step amount
         * @param step The amount to move the cursor back
         * @returns This path cursor
         */
        PathCursor.prototype.moveBack = function (step) {
            if (step === void 0) { step = 0.002; }
            this.move(-step);
            return this;
        };
        /**
         * Moves the cursor by the step amount
         * If the step amount is greater than one, an exception is thrown
         * @param step The amount to move the cursor
         * @returns This path cursor
         */
        PathCursor.prototype.move = function (step) {
            if (Math.abs(step) > 1) {
                throw "step size should be less than 1.";
            }
            this.value += step;
            this.ensureLimits();
            this.raiseOnChange();
            return this;
        };
        /**
         * Ensures that the value is limited between zero and one
         * @returns This path cursor
         */
        PathCursor.prototype.ensureLimits = function () {
            while (this.value > 1) {
                this.value -= 1;
            }
            while (this.value < 0) {
                this.value += 1;
            }
            return this;
        };
        /**
         * Runs onchange callbacks on change (used by the animation engine)
         * @returns This path cursor
         */
        PathCursor.prototype.raiseOnChange = function () {
            var _this = this;
            this._onchange.forEach(function (f) { return f(_this); });
            return this;
        };
        /**
         * Executes a function on change
         * @param f A path cursor onchange callback
         * @returns This path cursor
         */
        PathCursor.prototype.onchange = function (f) {
            this._onchange.push(f);
            return this;
        };
        return PathCursor;
    }());
    LIB.PathCursor = PathCursor;
    /**
     * Enum for the animation key frame interpolation type
     */
    var AnimationKeyInterpolation;
    (function (AnimationKeyInterpolation) {
        /**
         * Do not interpolate between keys and use the start key value only. Tangents are ignored
         */
        AnimationKeyInterpolation[AnimationKeyInterpolation["STEP"] = 1] = "STEP";
    })(AnimationKeyInterpolation = LIB.AnimationKeyInterpolation || (LIB.AnimationKeyInterpolation = {}));
    /**
     * Class used to store any kind of animation
     */
    var Animation = /** @class */ (function () {
        /**
         * Initializes the animation
         * @param name Name of the animation
         * @param targetProperty Property to animate
         * @param framePerSecond The frames per second of the animation
         * @param dataType The data type of the animation
         * @param loopMode The loop mode of the animation
         * @param enableBlendings Specifies if blending should be enabled
         */
        function Animation(
        /**Name of the animation */
        name, 
        /**Property to animate */
        targetProperty, 
        /**The frames per second of the animation */
        framePerSecond, 
        /**The data type of the animation */
        dataType, 
        /**The loop mode of the animation */
        loopMode, 
        /**Specifies if blending should be enabled */
        enableBlending) {
            this.name = name;
            this.targetProperty = targetProperty;
            this.framePerSecond = framePerSecond;
            this.dataType = dataType;
            this.loopMode = loopMode;
            this.enableBlending = enableBlending;
            /**
             * @hidden Internal use only
             */
            this._runtimeAnimations = new Array();
            /**
             * The set of event that will be linked to this animation
             */
            this._events = new Array();
            /**
             * Stores the blending speed of the animation
             */
            this.blendingSpeed = 0.01;
            /**
             * Stores the animation ranges for the animation
             */
            this._ranges = {};
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }
        /**
         * @hidden Internal use
         */
        Animation._PrepareAnimation = function (name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction) {
            var dataType = undefined;
            if (!isNaN(parseFloat(from)) && isFinite(from)) {
                dataType = Animation.ANIMATIONTYPE_FLOAT;
            }
            else if (from instanceof LIB.Quaternion) {
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
            }
            else if (from instanceof LIB.Vector3) {
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
            }
            else if (from instanceof LIB.Vector2) {
                dataType = Animation.ANIMATIONTYPE_VECTOR2;
            }
            else if (from instanceof LIB.Color3) {
                dataType = Animation.ANIMATIONTYPE_COLOR3;
            }
            else if (from instanceof LIB.Size) {
                dataType = Animation.ANIMATIONTYPE_SIZE;
            }
            if (dataType == undefined) {
                return null;
            }
            var animation = new Animation(name, targetProperty, framePerSecond, dataType, loopMode);
            var keys = [{ frame: 0, value: from }, { frame: totalFrame, value: to }];
            animation.setKeys(keys);
            if (easingFunction !== undefined) {
                animation.setEasingFunction(easingFunction);
            }
            return animation;
        };
        /**
         * Sets up an animation
         * @param property The property to animate
         * @param animationType The animation type to apply
         * @param framePerSecond The frames per second of the animation
         * @param easingFunction The easing function used in the animation
         * @returns The created animation
         */
        Animation.CreateAnimation = function (property, animationType, framePerSecond, easingFunction) {
            var animation = new Animation(property + "Animation", property, framePerSecond, animationType, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animation.setEasingFunction(easingFunction);
            return animation;
        };
        /**
         * Create and start an animation on a node
         * @param name defines the name of the global animation that will be run on all nodes
         * @param node defines the root node where the animation will take place
         * @param targetProperty defines property to animate
         * @param framePerSecond defines the number of frame per second yo use
         * @param totalFrame defines the number of frames in total
         * @param from defines the initial value
         * @param to defines the final value
         * @param loopMode defines which loop mode you want to use (off by default)
         * @param easingFunction defines the easing function to use (linear by default)
         * @param onAnimationEnd defines the callback to call when animation end
         * @returns the animatable created for this animation
         */
        Animation.CreateAndStartAnimation = function (name, node, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            if (!animation) {
                return null;
            }
            return node.getScene().beginDirectAnimation(node, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
        /**
         * Create and start an animation on a node and its descendants
         * @param name defines the name of the global animation that will be run on all nodes
         * @param node defines the root node where the animation will take place
         * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used
         * @param targetProperty defines property to animate
         * @param framePerSecond defines the number of frame per second to use
         * @param totalFrame defines the number of frames in total
         * @param from defines the initial value
         * @param to defines the final value
         * @param loopMode defines which loop mode you want to use (off by default)
         * @param easingFunction defines the easing function to use (linear by default)
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of animatables created for all nodes
         * @example https://www.LIBjs-playground.com/#MH0VLI
         */
        Animation.CreateAndStartHierarchyAnimation = function (name, node, directDescendantsOnly, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            if (!animation) {
                return null;
            }
            var scene = node.getScene();
            return scene.beginDirectHierarchyAnimation(node, directDescendantsOnly, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
        /**
         * Creates a new animation, merges it with the existing animations and starts it
         * @param name Name of the animation
         * @param node Node which contains the scene that begins the animations
         * @param targetProperty Specifies which property to animate
         * @param framePerSecond The frames per second of the animation
         * @param totalFrame The total number of frames
         * @param from The frame at the beginning of the animation
         * @param to The frame at the end of the animation
         * @param loopMode Specifies the loop mode of the animation
         * @param easingFunction (Optional) The easing function of the animation, which allow custom mathematical formulas for animations
         * @param onAnimationEnd Callback to run once the animation is complete
         * @returns Nullable animation
         */
        Animation.CreateMergeAndStartAnimation = function (name, node, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            if (!animation) {
                return null;
            }
            node.animations.push(animation);
            return node.getScene().beginAnimation(node, 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
        /**
         * Transition property of the Camera to the target Value
         * @param property The property to transition
         * @param targetValue The target Value of the property
         * @param host The object where the property to animate belongs
         * @param scene Scene used to run the animation
         * @param frameRate Framerate (in frame/s) to use
         * @param transition The transition type we want to use
         * @param duration The duration of the animation, in milliseconds
         * @param onAnimationEnd Callback trigger at the end of the animation
         * @returns Nullable animation
         */
        Animation.TransitionTo = function (property, targetValue, host, scene, frameRate, transition, duration, onAnimationEnd) {
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            if (duration <= 0) {
                host[property] = targetValue;
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
                return null;
            }
            var endFrame = frameRate * (duration / 1000);
            transition.setKeys([{
                    frame: 0,
                    value: host[property].clone ? host[property].clone() : host[property]
                },
                {
                    frame: endFrame,
                    value: targetValue
                }]);
            if (!host.animations) {
                host.animations = [];
            }
            host.animations.push(transition);
            var animation = scene.beginAnimation(host, 0, endFrame, false);
            animation.onAnimationEnd = onAnimationEnd;
            return animation;
        };
        Object.defineProperty(Animation.prototype, "runtimeAnimations", {
            /**
             * Return the array of runtime animations currently using this animation
             */
            get: function () {
                return this._runtimeAnimations;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "hasRunningRuntimeAnimations", {
            /**
             * Specifies if any of the runtime animations are currently running
             */
            get: function () {
                for (var _i = 0, _a = this._runtimeAnimations; _i < _a.length; _i++) {
                    var runtimeAnimation = _a[_i];
                    if (!runtimeAnimation.isStopped) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        /**
         * Converts the animation to a string
         * @param fullDetails support for multiple levels of logging within scene loading
         * @returns String form of the animation
         */
        Animation.prototype.toString = function (fullDetails) {
            var ret = "Name: " + this.name + ", property: " + this.targetProperty;
            ret += ", datatype: " + (["Float", "Vector3", "Quaternion", "Matrix", "Color3", "Vector2"])[this.dataType];
            ret += ", nKeys: " + (this._keys ? this._keys.length : "none");
            ret += ", nRanges: " + (this._ranges ? Object.keys(this._ranges).length : "none");
            if (fullDetails) {
                ret += ", Ranges: {";
                var first = true;
                for (var name in this._ranges) {
                    if (first) {
                        ret += ", ";
                        first = false;
                    }
                    ret += name;
                }
                ret += "}";
            }
            return ret;
        };
        /**
         * Add an event to this animation
         * @param event Event to add
         */
        Animation.prototype.addEvent = function (event) {
            this._events.push(event);
        };
        /**
         * Remove all events found at the given frame
         * @param frame The frame to remove events from
         */
        Animation.prototype.removeEvents = function (frame) {
            for (var index = 0; index < this._events.length; index++) {
                if (this._events[index].frame === frame) {
                    this._events.splice(index, 1);
                    index--;
                }
            }
        };
        /**
         * Retrieves all the events from the animation
         * @returns Events from the animation
         */
        Animation.prototype.getEvents = function () {
            return this._events;
        };
        /**
         * Creates an animation range
         * @param name Name of the animation range
         * @param from Starting frame of the animation range
         * @param to Ending frame of the animation
         */
        Animation.prototype.createRange = function (name, from, to) {
            // check name not already in use; could happen for bones after serialized
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
            }
        };
        /**
         * Deletes an animation range by name
         * @param name Name of the animation range to delete
         * @param deleteFrames Specifies if the key frames for the range should also be deleted (true) or not (false)
         */
        Animation.prototype.deleteRange = function (name, deleteFrames) {
            if (deleteFrames === void 0) { deleteFrames = true; }
            var range = this._ranges[name];
            if (!range) {
                return;
            }
            if (deleteFrames) {
                var from = range.from;
                var to = range.to;
                // this loop MUST go high to low for multiple splices to work
                for (var key = this._keys.length - 1; key >= 0; key--) {
                    if (this._keys[key].frame >= from && this._keys[key].frame <= to) {
                        this._keys.splice(key, 1);
                    }
                }
            }
            this._ranges[name] = null; // said much faster than 'delete this._range[name]' 
        };
        /**
         * Gets the animation range by name, or null if not defined
         * @param name Name of the animation range
         * @returns Nullable animation range
         */
        Animation.prototype.getRange = function (name) {
            return this._ranges[name];
        };
        /**
         * Gets the key frames from the animation
         * @returns The key frames of the animation
         */
        Animation.prototype.getKeys = function () {
            return this._keys;
        };
        /**
         * Gets the highest frame rate of the animation
         * @returns Highest frame rate of the animation
         */
        Animation.prototype.getHighestFrame = function () {
            var ret = 0;
            for (var key = 0, nKeys = this._keys.length; key < nKeys; key++) {
                if (ret < this._keys[key].frame) {
                    ret = this._keys[key].frame;
                }
            }
            return ret;
        };
        /**
         * Gets the easing function of the animation
         * @returns Easing function of the animation
         */
        Animation.prototype.getEasingFunction = function () {
            return this._easingFunction;
        };
        /**
         * Sets the easing function of the animation
         * @param easingFunction A custom mathematical formula for animation
         */
        Animation.prototype.setEasingFunction = function (easingFunction) {
            this._easingFunction = easingFunction;
        };
        /**
         * Interpolates a scalar linearly
         * @param startValue Start value of the animation curve
         * @param endValue End value of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated scalar value
         */
        Animation.prototype.floatInterpolateFunction = function (startValue, endValue, gradient) {
            return LIB.Scalar.Lerp(startValue, endValue, gradient);
        };
        /**
         * Interpolates a scalar cubically
         * @param startValue Start value of the animation curve
         * @param outTangent End tangent of the animation
         * @param endValue End value of the animation curve
         * @param inTangent Start tangent of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated scalar value
         */
        Animation.prototype.floatInterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return LIB.Scalar.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        };
        /**
         * Interpolates a quaternion using a spherical linear interpolation
         * @param startValue Start value of the animation curve
         * @param endValue End value of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated quaternion value
         */
        Animation.prototype.quaternionInterpolateFunction = function (startValue, endValue, gradient) {
            return LIB.Quaternion.Slerp(startValue, endValue, gradient);
        };
        /**
         * Interpolates a quaternion cubically
         * @param startValue Start value of the animation curve
         * @param outTangent End tangent of the animation curve
         * @param endValue End value of the animation curve
         * @param inTangent Start tangent of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated quaternion value
         */
        Animation.prototype.quaternionInterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return LIB.Quaternion.Hermite(startValue, outTangent, endValue, inTangent, gradient).normalize();
        };
        /**
         * Interpolates a Vector3 linearl
         * @param startValue Start value of the animation curve
         * @param endValue End value of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated scalar value
         */
        Animation.prototype.vector3InterpolateFunction = function (startValue, endValue, gradient) {
            return LIB.Vector3.Lerp(startValue, endValue, gradient);
        };
        /**
         * Interpolates a Vector3 cubically
         * @param startValue Start value of the animation curve
         * @param outTangent End tangent of the animation
         * @param endValue End value of the animation curve
         * @param inTangent Start tangent of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns InterpolatedVector3 value
         */
        Animation.prototype.vector3InterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return LIB.Vector3.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        };
        /**
         * Interpolates a Vector2 linearly
         * @param startValue Start value of the animation curve
         * @param endValue End value of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated Vector2 value
         */
        Animation.prototype.vector2InterpolateFunction = function (startValue, endValue, gradient) {
            return LIB.Vector2.Lerp(startValue, endValue, gradient);
        };
        /**
         * Interpolates a Vector2 cubically
         * @param startValue Start value of the animation curve
         * @param outTangent End tangent of the animation
         * @param endValue End value of the animation curve
         * @param inTangent Start tangent of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated Vector2 value
         */
        Animation.prototype.vector2InterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return LIB.Vector2.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        };
        /**
         * Interpolates a size linearly
         * @param startValue Start value of the animation curve
         * @param endValue End value of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated Size value
         */
        Animation.prototype.sizeInterpolateFunction = function (startValue, endValue, gradient) {
            return LIB.Size.Lerp(startValue, endValue, gradient);
        };
        /**
         * Interpolates a Color3 linearly
         * @param startValue Start value of the animation curve
         * @param endValue End value of the animation curve
         * @param gradient Scalar amount to interpolate
         * @returns Interpolated Color3 value
         */
        Animation.prototype.color3InterpolateFunction = function (startValue, endValue, gradient) {
            return LIB.Color3.Lerp(startValue, endValue, gradient);
        };
        /**
         * @hidden Internal use only
         */
        Animation.prototype._getKeyValue = function (value) {
            if (typeof value === "function") {
                return value();
            }
            return value;
        };
        /**
         * @hidden Internal use only
         */
        Animation.prototype._interpolate = function (currentFrame, repeatCount, workValue, loopMode, offsetValue, highLimitValue) {
            if (loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
                return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
            }
            var keys = this.getKeys();
            // Try to get a hash to find the right key
            var startKeyIndex = Math.max(0, Math.min(keys.length - 1, Math.floor(keys.length * (currentFrame - keys[0].frame) / (keys[keys.length - 1].frame - keys[0].frame)) - 1));
            if (keys[startKeyIndex].frame >= currentFrame) {
                while (startKeyIndex - 1 >= 0 && keys[startKeyIndex].frame >= currentFrame) {
                    startKeyIndex--;
                }
            }
            for (var key = startKeyIndex; key < keys.length; key++) {
                var endKey = keys[key + 1];
                if (endKey.frame >= currentFrame) {
                    var startKey = keys[key];
                    var startValue = this._getKeyValue(startKey.value);
                    if (startKey.interpolation === AnimationKeyInterpolation.STEP) {
                        return startValue;
                    }
                    var endValue = this._getKeyValue(endKey.value);
                    var useTangent = startKey.outTangent !== undefined && endKey.inTangent !== undefined;
                    var frameDelta = endKey.frame - startKey.frame;
                    // gradient : percent of currentFrame between the frame inf and the frame sup
                    var gradient = (currentFrame - startKey.frame) / frameDelta;
                    // check for easingFunction and correction of gradient
                    var easingFunction = this.getEasingFunction();
                    if (easingFunction != null) {
                        gradient = easingFunction.ease(gradient);
                    }
                    switch (this.dataType) {
                        // Float
                        case Animation.ANIMATIONTYPE_FLOAT:
                            var floatValue = useTangent ? this.floatInterpolateFunctionWithTangents(startValue, startKey.outTangent * frameDelta, endValue, endKey.inTangent * frameDelta, gradient) : this.floatInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return floatValue;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return offsetValue * repeatCount + floatValue;
                            }
                            break;
                        // Quaternion
                        case Animation.ANIMATIONTYPE_QUATERNION:
                            var quatValue = useTangent ? this.quaternionInterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this.quaternionInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return quatValue;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return quatValue.addInPlace(offsetValue.scale(repeatCount));
                            }
                            return quatValue;
                        // Vector3
                        case Animation.ANIMATIONTYPE_VECTOR3:
                            var vec3Value = useTangent ? this.vector3InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this.vector3InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec3Value;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec3Value.add(offsetValue.scale(repeatCount));
                            }
                        // Vector2
                        case Animation.ANIMATIONTYPE_VECTOR2:
                            var vec2Value = useTangent ? this.vector2InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this.vector2InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec2Value;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec2Value.add(offsetValue.scale(repeatCount));
                            }
                        // Size
                        case Animation.ANIMATIONTYPE_SIZE:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.sizeInterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.sizeInterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Color3
                        case Animation.ANIMATIONTYPE_COLOR3:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.color3InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.color3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Matrix
                        case Animation.ANIMATIONTYPE_MATRIX:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    if (Animation.AllowMatricesInterpolation) {
                                        return this.matrixInterpolateFunction(startValue, endValue, gradient, workValue);
                                    }
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return startValue;
                            }
                        default:
                            break;
                    }
                    break;
                }
            }
            return this._getKeyValue(keys[keys.length - 1].value);
        };
        /**
         * Defines the function to use to interpolate matrices
         * @param startValue defines the start matrix
         * @param endValue defines the end matrix
         * @param gradient defines the gradient between both matrices
         * @param result defines an optional target matrix where to store the interpolation
         * @returns the interpolated matrix
         */
        Animation.prototype.matrixInterpolateFunction = function (startValue, endValue, gradient, result) {
            if (Animation.AllowMatrixDecomposeForInterpolation) {
                if (result) {
                    LIB.Matrix.DecomposeLerpToRef(startValue, endValue, gradient, result);
                    return result;
                }
                return LIB.Matrix.DecomposeLerp(startValue, endValue, gradient);
            }
            if (result) {
                LIB.Matrix.LerpToRef(startValue, endValue, gradient, result);
                return result;
            }
            return LIB.Matrix.Lerp(startValue, endValue, gradient);
        };
        /**
         * Makes a copy of the animation
         * @returns Cloned animation
         */
        Animation.prototype.clone = function () {
            var clone = new Animation(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);
            clone.enableBlending = this.enableBlending;
            clone.blendingSpeed = this.blendingSpeed;
            if (this._keys) {
                clone.setKeys(this._keys);
            }
            if (this._ranges) {
                clone._ranges = {};
                for (var name in this._ranges) {
                    var range = this._ranges[name];
                    if (!range) {
                        continue;
                    }
                    clone._ranges[name] = range.clone();
                }
            }
            return clone;
        };
        /**
         * Sets the key frames of the animation
         * @param values The animation key frames to set
         */
        Animation.prototype.setKeys = function (values) {
            this._keys = values.slice(0);
        };
        /**
         * Serializes the animation to an object
         * @returns Serialized object
         */
        Animation.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.property = this.targetProperty;
            serializationObject.framePerSecond = this.framePerSecond;
            serializationObject.dataType = this.dataType;
            serializationObject.loopBehavior = this.loopMode;
            serializationObject.enableBlending = this.enableBlending;
            serializationObject.blendingSpeed = this.blendingSpeed;
            var dataType = this.dataType;
            serializationObject.keys = [];
            var keys = this.getKeys();
            for (var index = 0; index < keys.length; index++) {
                var animationKey = keys[index];
                var key = {};
                key.frame = animationKey.frame;
                switch (dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        key.values = [animationKey.value];
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                    case Animation.ANIMATIONTYPE_MATRIX:
                    case Animation.ANIMATIONTYPE_VECTOR3:
                    case Animation.ANIMATIONTYPE_COLOR3:
                        key.values = animationKey.value.asArray();
                        break;
                }
                serializationObject.keys.push(key);
            }
            serializationObject.ranges = [];
            for (var name in this._ranges) {
                var source = this._ranges[name];
                if (!source) {
                    continue;
                }
                var range = {};
                range.name = name;
                range.from = source.from;
                range.to = source.to;
                serializationObject.ranges.push(range);
            }
            return serializationObject;
        };
        Object.defineProperty(Animation, "ANIMATIONTYPE_FLOAT", {
            /**
             * Get the float animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_FLOAT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_VECTOR3", {
            /**
             * Get the Vector3 animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_VECTOR3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_VECTOR2", {
            /**
             * Get the Vectpr2 animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_VECTOR2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_SIZE", {
            /**
             * Get the Size animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_SIZE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_QUATERNION", {
            /**
             * Get the Quaternion animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_QUATERNION;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_MATRIX", {
            /**
             * Get the Matrix animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_MATRIX;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_COLOR3", {
            /**
             * Get the Color3 animation type
             */
            get: function () {
                return Animation._ANIMATIONTYPE_COLOR3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONLOOPMODE_RELATIVE", {
            /**
             * Get the Relative Loop Mode
             */
            get: function () {
                return Animation._ANIMATIONLOOPMODE_RELATIVE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONLOOPMODE_CYCLE", {
            /**
             * Get the Cycle Loop Mode
             */
            get: function () {
                return Animation._ANIMATIONLOOPMODE_CYCLE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONLOOPMODE_CONSTANT", {
            /**
             * Get the Constant Loop Mode
             */
            get: function () {
                return Animation._ANIMATIONLOOPMODE_CONSTANT;
            },
            enumerable: true,
            configurable: true
        });
        /** @hidden */
        Animation._UniversalLerp = function (left, right, amount) {
            var constructor = left.constructor;
            if (constructor.Lerp) { // Lerp supported
                return constructor.Lerp(left, right, amount);
            }
            else if (constructor.Slerp) { // Slerp supported
                return constructor.Slerp(left, right, amount);
            }
            else if (left.toFixed) { // Number
                return left * (1.0 - amount) + amount * right;
            }
            else { // Blending not supported
                return right;
            }
        };
        /**
         * Parses an animation object and creates an animation
         * @param parsedAnimation Parsed animation object
         * @returns Animation object
         */
        Animation.Parse = function (parsedAnimation) {
            var animation = new Animation(parsedAnimation.name, parsedAnimation.property, parsedAnimation.framePerSecond, parsedAnimation.dataType, parsedAnimation.loopBehavior);
            var dataType = parsedAnimation.dataType;
            var keys = [];
            var data;
            var index;
            if (parsedAnimation.enableBlending) {
                animation.enableBlending = parsedAnimation.enableBlending;
            }
            if (parsedAnimation.blendingSpeed) {
                animation.blendingSpeed = parsedAnimation.blendingSpeed;
            }
            for (index = 0; index < parsedAnimation.keys.length; index++) {
                var key = parsedAnimation.keys[index];
                var inTangent;
                var outTangent;
                switch (dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        data = key.values[0];
                        if (key.values.length >= 1) {
                            inTangent = key.values[1];
                        }
                        if (key.values.length >= 2) {
                            outTangent = key.values[2];
                        }
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        data = LIB.Quaternion.FromArray(key.values);
                        if (key.values.length >= 8) {
                            var _inTangent = LIB.Quaternion.FromArray(key.values.slice(4, 8));
                            if (!_inTangent.equals(LIB.Quaternion.Zero())) {
                                inTangent = _inTangent;
                            }
                        }
                        if (key.values.length >= 12) {
                            var _outTangent = LIB.Quaternion.FromArray(key.values.slice(8, 12));
                            if (!_outTangent.equals(LIB.Quaternion.Zero())) {
                                outTangent = _outTangent;
                            }
                        }
                        break;
                    case Animation.ANIMATIONTYPE_MATRIX:
                        data = LIB.Matrix.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_COLOR3:
                        data = LIB.Color3.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR3:
                    default:
                        data = LIB.Vector3.FromArray(key.values);
                        break;
                }
                var keyData = {};
                keyData.frame = key.frame;
                keyData.value = data;
                if (inTangent != undefined) {
                    keyData.inTangent = inTangent;
                }
                if (outTangent != undefined) {
                    keyData.outTangent = outTangent;
                }
                keys.push(keyData);
            }
            animation.setKeys(keys);
            if (parsedAnimation.ranges) {
                for (index = 0; index < parsedAnimation.ranges.length; index++) {
                    data = parsedAnimation.ranges[index];
                    animation.createRange(data.name, data.from, data.to);
                }
            }
            return animation;
        };
        /**
         * Appends the serialized animations from the source animations
         * @param source Source containing the animations
         * @param destination Target to store the animations
         */
        Animation.AppendSerializedAnimations = function (source, destination) {
            if (source.animations) {
                destination.animations = [];
                for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                    var animation = source.animations[animationIndex];
                    destination.animations.push(animation.serialize());
                }
            }
        };
        /**
         * Use matrix interpolation instead of using direct key value when animating matrices
         */
        Animation.AllowMatricesInterpolation = false;
        /**
         * When matrix interpolation is enabled, this boolean forces the system to use Matrix.DecomposeLerp instead of Matrix.Lerp. Interpolation is more precise but slower
         */
        Animation.AllowMatrixDecomposeForInterpolation = true;
        // Statics
        /**
         * Float animation type
         */
        Animation._ANIMATIONTYPE_FLOAT = 0;
        /**
         * Vector3 animation type
         */
        Animation._ANIMATIONTYPE_VECTOR3 = 1;
        /**
         * Quaternion animation type
         */
        Animation._ANIMATIONTYPE_QUATERNION = 2;
        /**
         * Matrix animation type
         */
        Animation._ANIMATIONTYPE_MATRIX = 3;
        /**
         * Color3 animation type
         */
        Animation._ANIMATIONTYPE_COLOR3 = 4;
        /**
         * Vector2 animation type
         */
        Animation._ANIMATIONTYPE_VECTOR2 = 5;
        /**
         * Size animation type
         */
        Animation._ANIMATIONTYPE_SIZE = 6;
        /**
         * Relative Loop Mode
         */
        Animation._ANIMATIONLOOPMODE_RELATIVE = 0;
        /**
         * Cycle Loop Mode
         */
        Animation._ANIMATIONLOOPMODE_CYCLE = 1;
        /**
         * Constant Loop Mode
         */
        Animation._ANIMATIONLOOPMODE_CONSTANT = 2;
        return Animation;
    }());
    LIB.Animation = Animation;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.animation.js.map
//# sourceMappingURL=LIB.animation.js.map
