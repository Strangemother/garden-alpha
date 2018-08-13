

var LIB;
(function (LIB) {
    /**
     * Defines the LoadedMeshInfo object that describes information about the loaded webVR controller mesh
     */
    var LoadedMeshInfo = /** @class */ (function () {
        function LoadedMeshInfo() {
            /**
             * Map of the button meshes contained in the controller
             */
            this.buttonMeshes = {};
            /**
             * Map of the axis meshes contained in the controller
             */
            this.axisMeshes = {};
        }
        return LoadedMeshInfo;
    }());
    /**
     * Defines the WindowsMotionController object that the state of the windows motion controller
     */
    var WindowsMotionController = /** @class */ (function (_super) {
        __extends(WindowsMotionController, _super);
        /**
         * Creates a new WindowsMotionController from a gamepad
         * @param vrGamepad the gamepad that the controller should be created from
         */
        function WindowsMotionController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            _this._mapping = {
                // Semantic button names
                buttons: ['thumbstick', 'trigger', 'grip', 'menu', 'trackpad'],
                // A mapping of the button name to glTF model node name
                // that should be transformed by button value.
                buttonMeshNames: {
                    'trigger': 'SELECT',
                    'menu': 'MENU',
                    'grip': 'GRASP',
                    'thumbstick': 'THUMBSTICK_PRESS',
                    'trackpad': 'TOUCHPAD_PRESS'
                },
                // This mapping is used to translate from the Motion Controller to LIB semantics
                buttonObservableNames: {
                    'trigger': 'onTriggerStateChangedObservable',
                    'menu': 'onSecondaryButtonStateChangedObservable',
                    'grip': 'onMainButtonStateChangedObservable',
                    'thumbstick': 'onPadStateChangedObservable',
                    'trackpad': 'onTrackpadChangedObservable'
                },
                // A mapping of the axis name to glTF model node name
                // that should be transformed by axis value.
                // This array mirrors the browserGamepad.axes array, such that 
                // the mesh corresponding to axis 0 is in this array index 0.
                axisMeshNames: [
                    'THUMBSTICK_X',
                    'THUMBSTICK_Y',
                    'TOUCHPAD_TOUCH_X',
                    'TOUCHPAD_TOUCH_Y'
                ],
                pointingPoseMeshName: LIB.PoseEnabledController.POINTING_POSE
            };
            /**
             * Fired when the trackpad on this controller is clicked
             */
            _this.onTrackpadChangedObservable = new LIB.Observable();
            /**
             * Fired when the trackpad on this controller is modified
             */
            _this.onTrackpadValuesChangedObservable = new LIB.Observable();
            /**
             * The current x and y values of this controller's trackpad
             */
            _this.trackpad = { x: 0, y: 0 };
            _this.controllerType = LIB.PoseEnabledControllerType.WINDOWS;
            _this._loadedMeshInfo = null;
            return _this;
        }
        Object.defineProperty(WindowsMotionController.prototype, "onTriggerButtonStateChangedObservable", {
            /**
             * Fired when the trigger on this controller is modified
             */
            get: function () {
                return this.onTriggerStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onMenuButtonStateChangedObservable", {
            /**
             * Fired when the menu button on this controller is modified
             */
            get: function () {
                return this.onSecondaryButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onGripButtonStateChangedObservable", {
            /**
             * Fired when the grip button on this controller is modified
             */
            get: function () {
                return this.onMainButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onThumbstickButtonStateChangedObservable", {
            /**
             * Fired when the thumbstick button on this controller is modified
             */
            get: function () {
                return this.onPadStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onTouchpadButtonStateChangedObservable", {
            /**
             * Fired when the touchpad button on this controller is modified
             */
            get: function () {
                return this.onTrackpadChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onTouchpadValuesChangedObservable", {
            /**
             * Fired when the touchpad values on this controller are modified
             */
            get: function () {
                return this.onTrackpadValuesChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Called once per frame by the engine.
         */
        WindowsMotionController.prototype.update = function () {
            _super.prototype.update.call(this);
            if (this.browserGamepad.axes) {
                if (this.browserGamepad.axes[2] != this.trackpad.x || this.browserGamepad.axes[3] != this.trackpad.y) {
                    this.trackpad.x = this.browserGamepad["axes"][2];
                    this.trackpad.y = this.browserGamepad["axes"][3];
                    this.onTrackpadValuesChangedObservable.notifyObservers(this.trackpad);
                }
                // Only need to animate axes if there is a loaded mesh
                if (this._loadedMeshInfo) {
                    for (var axis = 0; axis < this._mapping.axisMeshNames.length; axis++) {
                        this._lerpAxisTransform(axis, this.browserGamepad.axes[axis]);
                    }
                }
            }
        };
        /**
         * Called once for each button that changed state since the last frame
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        WindowsMotionController.prototype._handleButtonChange = function (buttonIdx, state, changes) {
            var buttonName = this._mapping.buttons[buttonIdx];
            if (!buttonName) {
                return;
            }
            // Only emit events for buttons that we know how to map from index to name
            var observable = this[(this._mapping.buttonObservableNames)[buttonName]];
            if (observable) {
                observable.notifyObservers(state);
            }
            this._lerpButtonTransform(buttonName, state.value);
        };
        /**
         * Moves the buttons on the controller mesh based on their current state
         * @param buttonName the name of the button to move
         * @param buttonValue the value of the button which determines the buttons new position
         */
        WindowsMotionController.prototype._lerpButtonTransform = function (buttonName, buttonValue) {
            // If there is no loaded mesh, there is nothing to transform.
            if (!this._loadedMeshInfo) {
                return;
            }
            var meshInfo = this._loadedMeshInfo.buttonMeshes[buttonName];
            if (!meshInfo.unpressed.rotationQuaternion || !meshInfo.pressed.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
                return;
            }
            LIB.Quaternion.SlerpToRef(meshInfo.unpressed.rotationQuaternion, meshInfo.pressed.rotationQuaternion, buttonValue, meshInfo.value.rotationQuaternion);
            LIB.Vector3.LerpToRef(meshInfo.unpressed.position, meshInfo.pressed.position, buttonValue, meshInfo.value.position);
        };
        /**
         * Moves the axis on the controller mesh based on its current state
         * @param axis the index of the axis
         * @param axisValue the value of the axis which determines the meshes new position
         * @hidden
         */
        WindowsMotionController.prototype._lerpAxisTransform = function (axis, axisValue) {
            if (!this._loadedMeshInfo) {
                return;
            }
            var meshInfo = this._loadedMeshInfo.axisMeshes[axis];
            if (!meshInfo) {
                return;
            }
            if (!meshInfo.min.rotationQuaternion || !meshInfo.max.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
                return;
            }
            // Convert from gamepad value range (-1 to +1) to lerp range (0 to 1)
            var lerpValue = axisValue * 0.5 + 0.5;
            LIB.Quaternion.SlerpToRef(meshInfo.min.rotationQuaternion, meshInfo.max.rotationQuaternion, lerpValue, meshInfo.value.rotationQuaternion);
            LIB.Vector3.LerpToRef(meshInfo.min.position, meshInfo.max.position, lerpValue, meshInfo.value.position);
        };
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        WindowsMotionController.prototype.initControllerMesh = function (scene, meshLoaded, forceDefault) {
            var _this = this;
            if (forceDefault === void 0) { forceDefault = false; }
            var path;
            var filename;
            // Checking if GLB loader is present
            if (LIB.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
                // Determine the device specific folder based on the ID suffix
                var device = 'default';
                if (this.id && !forceDefault) {
                    var match = this.id.match(WindowsMotionController.GAMEPAD_ID_PATTERN);
                    device = ((match && match[0]) || device);
                }
                // Hand
                if (this.hand === 'left') {
                    filename = WindowsMotionController.MODEL_LEFT_FILENAME;
                }
                else { // Right is the default if no hand is specified
                    filename = WindowsMotionController.MODEL_RIGHT_FILENAME;
                }
                path = WindowsMotionController.MODEL_BASE_URL + device + '/';
            }
            else {
                LIB.Tools.Warn("You need to reference GLTF loader to load Windows Motion Controllers model. Falling back to generic models");
                path = LIB.GenericController.MODEL_BASE_URL;
                filename = LIB.GenericController.MODEL_FILENAME;
            }
            LIB.SceneLoader.ImportMesh("", path, filename, scene, function (meshes) {
                // glTF files successfully loaded from the remote server, now process them to ensure they are in the right format.
                _this._loadedMeshInfo = _this.processModel(scene, meshes);
                if (!_this._loadedMeshInfo) {
                    return;
                }
                _this._defaultModel = _this._loadedMeshInfo.rootNode;
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            }, null, function (scene, message) {
                LIB.Tools.Log(message);
                LIB.Tools.Warn('Failed to retrieve controller model from the remote server: ' + path + filename);
                if (!forceDefault) {
                    _this.initControllerMesh(scene, meshLoaded, true);
                }
            });
        };
        /**
         * Takes a list of meshes (as loaded from the glTF file) and finds the root node, as well as nodes that
         * can be transformed by button presses and axes values, based on this._mapping.
         *
         * @param scene scene in which the meshes exist
         * @param meshes list of meshes that make up the controller model to process
         * @return structured view of the given meshes, with mapping of buttons and axes to meshes that can be transformed.
         */
        WindowsMotionController.prototype.processModel = function (scene, meshes) {
            var loadedMeshInfo = null;
            // Create a new mesh to contain the glTF hierarchy
            var parentMesh = new LIB.Mesh(this.id + " " + this.hand, scene);
            // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
            var childMesh = null;
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                if (!mesh.parent) {
                    // Exclude controller meshes from picking results
                    mesh.isPickable = false;
                    // Handle root node, attach to the new parentMesh
                    childMesh = mesh;
                    break;
                }
            }
            if (childMesh) {
                childMesh.setParent(parentMesh);
                // Create our mesh info. Note that this method will always return non-null.
                loadedMeshInfo = this.createMeshInfo(parentMesh);
            }
            else {
                LIB.Tools.Warn('Could not find root node in model file.');
            }
            return loadedMeshInfo;
        };
        WindowsMotionController.prototype.createMeshInfo = function (rootNode) {
            var loadedMeshInfo = new LoadedMeshInfo();
            var i;
            loadedMeshInfo.rootNode = rootNode;
            // Reset the caches
            loadedMeshInfo.buttonMeshes = {};
            loadedMeshInfo.axisMeshes = {};
            // Button Meshes
            for (i = 0; i < this._mapping.buttons.length; i++) {
                var buttonMeshName = this._mapping.buttonMeshNames[this._mapping.buttons[i]];
                if (!buttonMeshName) {
                    LIB.Tools.Log('Skipping unknown button at index: ' + i + ' with mapped name: ' + this._mapping.buttons[i]);
                    continue;
                }
                var buttonMesh = getChildByName(rootNode, buttonMeshName);
                if (!buttonMesh) {
                    LIB.Tools.Warn('Missing button mesh with name: ' + buttonMeshName);
                    continue;
                }
                var buttonMeshInfo = {
                    index: i,
                    value: getImmediateChildByName(buttonMesh, 'VALUE'),
                    pressed: getImmediateChildByName(buttonMesh, 'PRESSED'),
                    unpressed: getImmediateChildByName(buttonMesh, 'UNPRESSED')
                };
                if (buttonMeshInfo.value && buttonMeshInfo.pressed && buttonMeshInfo.unpressed) {
                    loadedMeshInfo.buttonMeshes[this._mapping.buttons[i]] = buttonMeshInfo;
                }
                else {
                    // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                    LIB.Tools.Warn('Missing button submesh under mesh with name: ' + buttonMeshName +
                        '(VALUE: ' + !!buttonMeshInfo.value +
                        ', PRESSED: ' + !!buttonMeshInfo.pressed +
                        ', UNPRESSED:' + !!buttonMeshInfo.unpressed +
                        ')');
                }
            }
            // Axis Meshes
            for (i = 0; i < this._mapping.axisMeshNames.length; i++) {
                var axisMeshName = this._mapping.axisMeshNames[i];
                if (!axisMeshName) {
                    LIB.Tools.Log('Skipping unknown axis at index: ' + i);
                    continue;
                }
                var axisMesh = getChildByName(rootNode, axisMeshName);
                if (!axisMesh) {
                    LIB.Tools.Warn('Missing axis mesh with name: ' + axisMeshName);
                    continue;
                }
                var axisMeshInfo = {
                    index: i,
                    value: getImmediateChildByName(axisMesh, 'VALUE'),
                    min: getImmediateChildByName(axisMesh, 'MIN'),
                    max: getImmediateChildByName(axisMesh, 'MAX')
                };
                if (axisMeshInfo.value && axisMeshInfo.min && axisMeshInfo.max) {
                    loadedMeshInfo.axisMeshes[i] = axisMeshInfo;
                }
                else {
                    // If we didn't find the mesh, it simply means thit axis won't have transforms applied as mapped axis values change.
                    LIB.Tools.Warn('Missing axis submesh under mesh with name: ' + axisMeshName +
                        '(VALUE: ' + !!axisMeshInfo.value +
                        ', MIN: ' + !!axisMeshInfo.min +
                        ', MAX:' + !!axisMeshInfo.max +
                        ')');
                }
            }
            // Pointing Ray
            loadedMeshInfo.pointingPoseNode = getChildByName(rootNode, this._mapping.pointingPoseMeshName);
            if (!loadedMeshInfo.pointingPoseNode) {
                LIB.Tools.Warn('Missing pointing pose mesh with name: ' + this._mapping.pointingPoseMeshName);
            }
            return loadedMeshInfo;
            // Look through all children recursively. This will return null if no mesh exists with the given name.
            function getChildByName(node, name) {
                return node.getChildMeshes(false, function (n) { return n.name === name; })[0];
            }
            // Look through only immediate children. This will return null if no mesh exists with the given name.
            function getImmediateChildByName(node, name) {
                return node.getChildMeshes(true, function (n) { return n.name == name; })[0];
            }
        };
        /**
         * Gets the ray of the controller in the direction the controller is pointing
         * @param length the length the resulting ray should be
         * @returns a ray in the direction the controller is pointing
         */
        WindowsMotionController.prototype.getForwardRay = function (length) {
            if (length === void 0) { length = 100; }
            if (!(this._loadedMeshInfo && this._loadedMeshInfo.pointingPoseNode)) {
                return _super.prototype.getForwardRay.call(this, length);
            }
            var m = this._loadedMeshInfo.pointingPoseNode.getWorldMatrix();
            var origin = m.getTranslation();
            var forward = new LIB.Vector3(0, 0, -1);
            var forwardWorld = LIB.Vector3.TransformNormal(forward, m);
            var direction = LIB.Vector3.Normalize(forwardWorld);
            return new LIB.Ray(origin, direction, length);
        };
        /**
        * Disposes of the controller
        */
        WindowsMotionController.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.onTrackpadChangedObservable.clear();
        };
        /**
         * The base url used to load the left and right controller models
         */
        WindowsMotionController.MODEL_BASE_URL = 'https://controllers.LIBjs.com/microsoft/';
        /**
         * The name of the left controller model file
         */
        WindowsMotionController.MODEL_LEFT_FILENAME = 'left.glb';
        /**
         * The name of the right controller model file
         */
        WindowsMotionController.MODEL_RIGHT_FILENAME = 'right.glb';
        /**
         * The controller name prefix for this controller type
         */
        WindowsMotionController.GAMEPAD_ID_PREFIX = 'Spatial Controller (Spatial Interaction Source) ';
        /**
         * The controller id pattern for this controller type
         */
        WindowsMotionController.GAMEPAD_ID_PATTERN = /([0-9a-zA-Z]+-[0-9a-zA-Z]+)$/;
        return WindowsMotionController;
    }(LIB.WebVRController));
    LIB.WindowsMotionController = WindowsMotionController;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.windowsMotionController.js.map
//# sourceMappingURL=LIB.windowsMotionController.js.map
