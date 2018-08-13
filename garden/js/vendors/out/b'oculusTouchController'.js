

var LIB;
(function (LIB) {
    /**
     * Oculus Touch Controller
     */
    var OculusTouchController = /** @class */ (function (_super) {
        __extends(OculusTouchController, _super);
        /**
         * Creates a new OculusTouchController from a gamepad
         * @param vrGamepad the gamepad that the controller should be created from
         */
        function OculusTouchController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            /**
             * Fired when the secondary trigger on this controller is modified
             */
            _this.onSecondaryTriggerStateChangedObservable = new LIB.Observable();
            /**
             * Fired when the thumb rest on this controller is modified
             */
            _this.onThumbRestChangedObservable = new LIB.Observable();
            _this.controllerType = LIB.PoseEnabledControllerType.OCULUS;
            return _this;
        }
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        OculusTouchController.prototype.initControllerMesh = function (scene, meshLoaded) {
            var _this = this;
            var meshName;
            // Hand
            if (this.hand === 'left') {
                meshName = OculusTouchController.MODEL_LEFT_FILENAME;
            }
            else { // Right is the default if no hand is specified
                meshName = OculusTouchController.MODEL_RIGHT_FILENAME;
            }
            LIB.SceneLoader.ImportMesh("", OculusTouchController.MODEL_BASE_URL, meshName, scene, function (newMeshes) {
                /*
                Parent Mesh name: oculus_touch_left
                - body
                - trigger
                - thumbstick
                - grip
                - button_y
                - button_x
                - button_enter
                */
                _this._defaultModel = newMeshes[1];
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            });
        };
        Object.defineProperty(OculusTouchController.prototype, "onAButtonStateChangedObservable", {
            /**
             * Fired when the A button on this controller is modified
             */
            get: function () {
                if (this.hand === 'right') {
                    return this.onMainButtonStateChangedObservable;
                }
                else {
                    throw new Error('No A button on left hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OculusTouchController.prototype, "onBButtonStateChangedObservable", {
            /**
             * Fired when the B button on this controller is modified
             */
            get: function () {
                if (this.hand === 'right') {
                    return this.onSecondaryButtonStateChangedObservable;
                }
                else {
                    throw new Error('No B button on left hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OculusTouchController.prototype, "onXButtonStateChangedObservable", {
            /**
             * Fired when the X button on this controller is modified
             */
            get: function () {
                if (this.hand === 'left') {
                    return this.onMainButtonStateChangedObservable;
                }
                else {
                    throw new Error('No X button on right hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OculusTouchController.prototype, "onYButtonStateChangedObservable", {
            /**
             * Fired when the Y button on this controller is modified
             */
            get: function () {
                if (this.hand === 'left') {
                    return this.onSecondaryButtonStateChangedObservable;
                }
                else {
                    throw new Error('No Y button on right hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
          * Called once for each button that changed state since the last frame
          * 0) thumb stick (touch, press, value = pressed (0,1)). value is in this.leftStick
          * 1) index trigger (touch (?), press (only when value > 0.1), value 0 to 1)
          * 2) secondary trigger (same)
          * 3) A (right) X (left), touch, pressed = value
          * 4) B / Y
          * 5) thumb rest
          * @param buttonIdx Which button index changed
          * @param state New state of the button
          * @param changes Which properties on the state changed since last frame
          */
        OculusTouchController.prototype._handleButtonChange = function (buttonIdx, state, changes) {
            var notifyObject = state; //{ state: state, changes: changes };
            var triggerDirection = this.hand === 'right' ? -1 : 1;
            switch (buttonIdx) {
                case 0:
                    this.onPadStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 1: // index trigger
                    if (this._defaultModel) {
                        (this._defaultModel.getChildren()[3]).rotation.x = -notifyObject.value * 0.20;
                        (this._defaultModel.getChildren()[3]).position.y = -notifyObject.value * 0.005;
                        (this._defaultModel.getChildren()[3]).position.z = -notifyObject.value * 0.005;
                    }
                    this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 2: // secondary trigger
                    if (this._defaultModel) {
                        (this._defaultModel.getChildren()[4]).position.x = triggerDirection * notifyObject.value * 0.0035;
                    }
                    this.onSecondaryTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 3:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (this._defaultModel.getChildren()[1]).position.y = -0.001;
                        }
                        else {
                            (this._defaultModel.getChildren()[1]).position.y = 0;
                        }
                    }
                    this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 4:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (this._defaultModel.getChildren()[2]).position.y = -0.001;
                        }
                        else {
                            (this._defaultModel.getChildren()[2]).position.y = 0;
                        }
                    }
                    this.onSecondaryButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 5:
                    this.onThumbRestChangedObservable.notifyObservers(notifyObject);
                    return;
            }
        };
        /**
         * Base Url for the controller model.
         */
        OculusTouchController.MODEL_BASE_URL = 'https://controllers.LIBjs.com/oculus/';
        /**
         * File name for the left controller model.
         */
        OculusTouchController.MODEL_LEFT_FILENAME = 'left.LIB';
        /**
         * File name for the right controller model.
         */
        OculusTouchController.MODEL_RIGHT_FILENAME = 'right.LIB';
        return OculusTouchController;
    }(LIB.WebVRController));
    LIB.OculusTouchController = OculusTouchController;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.oculusTouchController.js.map
//# sourceMappingURL=LIB.oculusTouchController.js.map
