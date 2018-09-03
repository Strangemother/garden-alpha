
var LIB;
(function (LIB) {
    /**
     * The action to be carried out following a trigger
     * @see http://doc.LIBjs.com/how_to/how_to_use_actions#available-actions
     */
    var Action = /** @class */ (function () {
        /**
         * Creates a new Action
         * @param triggerOptions the trigger, with or without parameters, for the action
         * @param condition an optional determinant of action
         */
        function Action(
        /** the trigger, with or without parameters, for the action */
        triggerOptions, condition) {
            this.triggerOptions = triggerOptions;
            /**
            * An event triggered prior to action being executed.
            */
            this.onBeforeExecuteObservable = new LIB.Observable();
            if (triggerOptions.parameter) {
                this.trigger = triggerOptions.trigger;
                this._triggerParameter = triggerOptions.parameter;
            }
            else {
                this.trigger = triggerOptions;
            }
            this._nextActiveAction = this;
            this._condition = condition;
        }
        /**
         * Internal only
         * @hidden
         */
        Action.prototype._prepare = function () {
        };
        /**
         * Gets the trigger parameters
         * @returns the trigger parameters
         */
        Action.prototype.getTriggerParameter = function () {
            return this._triggerParameter;
        };
        /**
         * Internal only - executes current action event
         * @hidden
         */
        Action.prototype._executeCurrent = function (evt) {
            if (this._nextActiveAction._condition) {
                var condition = this._nextActiveAction._condition;
                var currentRenderId = this._actionManager.getScene().getRenderId();
                // We cache the current evaluation for the current frame
                if (condition._evaluationId === currentRenderId) {
                    if (!condition._currentResult) {
                        return;
                    }
                }
                else {
                    condition._evaluationId = currentRenderId;
                    if (!condition.isValid()) {
                        condition._currentResult = false;
                        return;
                    }
                    condition._currentResult = true;
                }
            }
            this.onBeforeExecuteObservable.notifyObservers(this);
            this._nextActiveAction.execute(evt);
            this.skipToNextActiveAction();
        };
        /**
         * Execute placeholder for child classes
         * @param evt optional action event
         */
        Action.prototype.execute = function (evt) {
        };
        /**
         * Skips to next active action
         */
        Action.prototype.skipToNextActiveAction = function () {
            if (this._nextActiveAction._child) {
                if (!this._nextActiveAction._child._actionManager) {
                    this._nextActiveAction._child._actionManager = this._actionManager;
                }
                this._nextActiveAction = this._nextActiveAction._child;
            }
            else {
                this._nextActiveAction = this;
            }
        };
        /**
         * Adds action to chain of actions, may be a DoNothingAction
         * @param action defines the next action to execute
         * @returns The action passed in
         * @see https://www.LIBjs-playground.com/#1T30HR#0
         */
        Action.prototype.then = function (action) {
            this._child = action;
            action._actionManager = this._actionManager;
            action._prepare();
            return action;
        };
        /**
         * Internal only
         * @hidden
         */
        Action.prototype._getProperty = function (propertyPath) {
            return this._actionManager._getProperty(propertyPath);
        };
        /**
         * Internal only
         * @hidden
         */
        Action.prototype._getEffectiveTarget = function (target, propertyPath) {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        };
        /**
         * Serialize placeholder for child classes
         * @param parent of child
         * @returns the serialized object
         */
        Action.prototype.serialize = function (parent) {
        };
        /**
         * Internal only called by serialize
         * @hidden
         */
        Action.prototype._serialize = function (serializedAction, parent) {
            var serializationObject = {
                type: 1,
                children: [],
                name: serializedAction.name,
                properties: serializedAction.properties || []
            };
            // Serialize child
            if (this._child) {
                this._child.serialize(serializationObject);
            }
            // Check if "this" has a condition
            if (this._condition) {
                var serializedCondition = this._condition.serialize();
                serializedCondition.children.push(serializationObject);
                if (parent) {
                    parent.children.push(serializedCondition);
                }
                return serializedCondition;
            }
            if (parent) {
                parent.children.push(serializationObject);
            }
            return serializationObject;
        };
        /**
         * Internal only
         * @hidden
         */
        Action._SerializeValueAsString = function (value) {
            if (typeof value === "number") {
                return value.toString();
            }
            if (typeof value === "boolean") {
                return value ? "true" : "false";
            }
            if (value instanceof LIB.Vector2) {
                return value.x + ", " + value.y;
            }
            if (value instanceof LIB.Vector3) {
                return value.x + ", " + value.y + ", " + value.z;
            }
            if (value instanceof LIB.Color3) {
                return value.r + ", " + value.g + ", " + value.b;
            }
            if (value instanceof LIB.Color4) {
                return value.r + ", " + value.g + ", " + value.b + ", " + value.a;
            }
            return value; // string
        };
        /**
         * Internal only
         * @hidden
         */
        Action._GetTargetProperty = function (target) {
            return {
                name: "target",
                targetType: target instanceof LIB.Mesh ? "MeshProperties"
                    : target instanceof LIB.Light ? "LightProperties"
                        : target instanceof LIB.Camera ? "CameraProperties"
                            : "SceneProperties",
                value: target instanceof LIB.Scene ? "Scene" : target.name
            };
        };
        return Action;
    }());
    LIB.Action = Action;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.action.js.map
//# sourceMappingURL=LIB.action.js.map