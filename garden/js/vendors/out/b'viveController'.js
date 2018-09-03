

var LIB;
(function (LIB) {
    /**
     * Vive Controller
     */
    var ViveController = /** @class */ (function (_super) {
        __extends(ViveController, _super);
        /**
         * Creates a new ViveController from a gamepad
         * @param vrGamepad the gamepad that the controller should be created from
         */
        function ViveController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            _this.controllerType = LIB.PoseEnabledControllerType.VIVE;
            _this._invertLeftStickY = true;
            return _this;
        }
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        ViveController.prototype.initControllerMesh = function (scene, meshLoaded) {
            var _this = this;
            LIB.SceneLoader.ImportMesh("", ViveController.MODEL_BASE_URL, ViveController.MODEL_FILENAME, scene, function (newMeshes) {
                /*
                Parent Mesh name: ViveWand
                - body
                - r_gripper
                - l_gripper
                - menu_button
                - system_button
                - trackpad
                - trigger
                - LED
                */
                _this._defaultModel = newMeshes[1];
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            });
        };
        Object.defineProperty(ViveController.prototype, "onLeftButtonStateChangedObservable", {
            /**
             * Fired when the left button on this controller is modified
             */
            get: function () {
                return this.onMainButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViveController.prototype, "onRightButtonStateChangedObservable", {
            /**
             * Fired when the right button on this controller is modified
             */
            get: function () {
                return this.onMainButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViveController.prototype, "onMenuButtonStateChangedObservable", {
            /**
             * Fired when the menu button on this controller is modified
             */
            get: function () {
                return this.onSecondaryButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Called once for each button that changed state since the last frame
         * Vive mapping:
         * 0: touchpad
         * 1: trigger
         * 2: left AND right buttons
         * 3: menu button
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        ViveController.prototype._handleButtonChange = function (buttonIdx, state, changes) {
            var notifyObject = state; //{ state: state, changes: changes };
            switch (buttonIdx) {
                case 0:
                    this.onPadStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 1: // index trigger
                    if (this._defaultModel) {
                        (this._defaultModel.getChildren()[6]).rotation.x = -notifyObject.value * 0.15;
                    }
                    this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 2: // left AND right button
                    this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 3:
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
            }
        };
        /**
         * Base Url for the controller model.
         */
        ViveController.MODEL_BASE_URL = 'https://controllers.LIBjs.com/vive/';
        /**
         * File name for the controller model.
         */
        ViveController.MODEL_FILENAME = 'wand.LIB';
        return ViveController;
    }(LIB.WebVRController));
    LIB.ViveController = ViveController;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.viveController.js.map
//# sourceMappingURL=LIB.viveController.js.map