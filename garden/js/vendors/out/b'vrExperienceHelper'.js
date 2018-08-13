

var LIB;
(function (LIB) {
    var VRExperienceHelperGazer = /** @class */ (function () {
        function VRExperienceHelperGazer(scene, gazeTrackerToClone) {
            if (gazeTrackerToClone === void 0) { gazeTrackerToClone = null; }
            this.scene = scene;
            this._pointerDownOnMeshAsked = false;
            this._isActionableMesh = false;
            this._teleportationRequestInitiated = false;
            this._teleportationBackRequestInitiated = false;
            this._rotationRightAsked = false;
            this._rotationLeftAsked = false;
            this._dpadPressed = true;
            this._activePointer = false;
            this._id = VRExperienceHelperGazer._idCounter++;
            // Gaze tracker
            if (!gazeTrackerToClone) {
                this._gazeTracker = LIB.Mesh.CreateTorus("gazeTracker", 0.0035, 0.0025, 20, scene, false);
                this._gazeTracker.bakeCurrentTransformIntoVertices();
                this._gazeTracker.isPickable = false;
                this._gazeTracker.isVisible = false;
                var targetMat = new LIB.StandardMaterial("targetMat", scene);
                targetMat.specularColor = LIB.Color3.Black();
                targetMat.emissiveColor = new LIB.Color3(0.7, 0.7, 0.7);
                targetMat.backFaceCulling = false;
                this._gazeTracker.material = targetMat;
            }
            else {
                this._gazeTracker = gazeTrackerToClone.clone("gazeTracker");
            }
        }
        VRExperienceHelperGazer.prototype._getForwardRay = function (length) {
            return new LIB.Ray(LIB.Vector3.Zero(), new LIB.Vector3(0, 0, length));
        };
        VRExperienceHelperGazer.prototype._selectionPointerDown = function () {
            this._pointerDownOnMeshAsked = true;
            if (this._currentMeshSelected && this._currentHit) {
                this.scene.simulatePointerDown(this._currentHit, { pointerId: this._id });
            }
        };
        VRExperienceHelperGazer.prototype._selectionPointerUp = function () {
            if (this._currentMeshSelected && this._currentHit) {
                this.scene.simulatePointerUp(this._currentHit, { pointerId: this._id });
            }
            this._pointerDownOnMeshAsked = false;
        };
        VRExperienceHelperGazer.prototype._activatePointer = function () {
            this._activePointer = true;
        };
        VRExperienceHelperGazer.prototype._deactivatePointer = function () {
            this._activePointer = false;
        };
        VRExperienceHelperGazer.prototype._updatePointerDistance = function (distance) {
            if (distance === void 0) { distance = 100; }
        };
        VRExperienceHelperGazer.prototype.dispose = function () {
            this._interactionsEnabled = false;
            this._teleportationEnabled = false;
            if (this._gazeTracker) {
                this._gazeTracker.dispose();
            }
        };
        VRExperienceHelperGazer._idCounter = 0;
        return VRExperienceHelperGazer;
    }());
    var VRExperienceHelperControllerGazer = /** @class */ (function (_super) {
        __extends(VRExperienceHelperControllerGazer, _super);
        function VRExperienceHelperControllerGazer(webVRController, scene, gazeTrackerToClone) {
            var _this = _super.call(this, scene, gazeTrackerToClone) || this;
            _this.webVRController = webVRController;
            // Laser pointer
            _this._laserPointer = LIB.Mesh.CreateCylinder("laserPointer", 1, 0.004, 0.0002, 20, 1, scene, false);
            var laserPointerMaterial = new LIB.StandardMaterial("laserPointerMat", scene);
            laserPointerMaterial.emissiveColor = new LIB.Color3(0.7, 0.7, 0.7);
            laserPointerMaterial.alpha = 0.6;
            _this._laserPointer.material = laserPointerMaterial;
            _this._laserPointer.rotation.x = Math.PI / 2;
            _this._laserPointer.position.z = -0.5;
            _this._laserPointer.isVisible = false;
            if (!webVRController.mesh) {
                // Create an empty mesh that is used prior to loading the high quality model
                var preloadMesh = new LIB.Mesh("preloadControllerMesh", scene);
                var preloadPointerPose = new LIB.Mesh(LIB.PoseEnabledController.POINTING_POSE, scene);
                preloadPointerPose.rotation.x = -0.7;
                preloadMesh.addChild(preloadPointerPose);
                webVRController.attachToMesh(preloadMesh);
            }
            _this._setLaserPointerParent(webVRController.mesh);
            _this._meshAttachedObserver = webVRController._meshAttachedObservable.add(function (mesh) {
                _this._setLaserPointerParent(mesh);
            });
            return _this;
        }
        VRExperienceHelperControllerGazer.prototype._getForwardRay = function (length) {
            return this.webVRController.getForwardRay(length);
        };
        VRExperienceHelperControllerGazer.prototype._activatePointer = function () {
            _super.prototype._activatePointer.call(this);
            this._laserPointer.isVisible = true;
        };
        VRExperienceHelperControllerGazer.prototype._deactivatePointer = function () {
            _super.prototype._deactivatePointer.call(this);
            this._laserPointer.isVisible = false;
        };
        VRExperienceHelperControllerGazer.prototype._setLaserPointerColor = function (color) {
            this._laserPointer.material.emissiveColor = color;
        };
        VRExperienceHelperControllerGazer.prototype._setLaserPointerParent = function (mesh) {
            var makeNotPick = function (root) {
                root.name += " laserPointer";
                root.getChildMeshes().forEach(function (c) {
                    makeNotPick(c);
                });
            };
            makeNotPick(mesh);
            var childMeshes = mesh.getChildMeshes();
            this.webVRController._pointingPoseNode = null;
            for (var i = 0; i < childMeshes.length; i++) {
                if (childMeshes[i].name && childMeshes[i].name.indexOf(LIB.PoseEnabledController.POINTING_POSE) >= 0) {
                    mesh = childMeshes[i];
                    this.webVRController._pointingPoseNode = mesh;
                    break;
                }
            }
            this._laserPointer.parent = mesh;
        };
        VRExperienceHelperControllerGazer.prototype._updatePointerDistance = function (distance) {
            if (distance === void 0) { distance = 100; }
            this._laserPointer.scaling.y = distance;
            this._laserPointer.position.z = -distance / 2;
        };
        VRExperienceHelperControllerGazer.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this._laserPointer.dispose();
            if (this._meshAttachedObserver) {
                this.webVRController._meshAttachedObservable.remove(this._meshAttachedObserver);
            }
        };
        return VRExperienceHelperControllerGazer;
    }(VRExperienceHelperGazer));
    var VRExperienceHelperCameraGazer = /** @class */ (function (_super) {
        __extends(VRExperienceHelperCameraGazer, _super);
        function VRExperienceHelperCameraGazer(getCamera, scene) {
            var _this = _super.call(this, scene) || this;
            _this.getCamera = getCamera;
            return _this;
        }
        VRExperienceHelperCameraGazer.prototype._getForwardRay = function (length) {
            var camera = this.getCamera();
            if (camera) {
                return camera.getForwardRay(length);
            }
            else {
                return new LIB.Ray(LIB.Vector3.Zero(), LIB.Vector3.Forward());
            }
        };
        return VRExperienceHelperCameraGazer;
    }(VRExperienceHelperGazer));
    /**
     * Helps to quickly add VR support to an existing scene.
     * See http://doc.LIBjs.com/how_to/webvr_helper
     */
    var VRExperienceHelper = /** @class */ (function () {
        /**
         * Instantiates a VRExperienceHelper.
         * Helps to quickly add VR support to an existing scene.
         * @param scene The scene the VRExperienceHelper belongs to.
         * @param webVROptions Options to modify the vr experience helper's behavior.
         */
        function VRExperienceHelper(scene, /** Options to modify the vr experience helper's behavior. */ webVROptions) {
            if (webVROptions === void 0) { webVROptions = {}; }
            var _this = this;
            this.webVROptions = webVROptions;
            // Can the system support WebVR, even if a headset isn't plugged in?
            this._webVRsupported = false;
            // If WebVR is supported, is a headset plugged in and are we ready to present?
            this._webVRready = false;
            // Are we waiting for the requestPresent callback to complete?
            this._webVRrequesting = false;
            // Are we presenting to the headset right now?
            this._webVRpresenting = false;
            // Are we presenting in the fullscreen fallback?
            this._fullscreenVRpresenting = false;
            /**
             * Observable raised when entering VR.
             */
            this.onEnteringVRObservable = new LIB.Observable();
            /**
             * Observable raised when exiting VR.
             */
            this.onExitingVRObservable = new LIB.Observable();
            /**
             * Observable raised when controller mesh is loaded.
             */
            this.onControllerMeshLoadedObservable = new LIB.Observable();
            this._useCustomVRButton = false;
            this._teleportationRequested = false;
            this._teleportActive = false;
            this._floorMeshesCollection = [];
            this._rotationAllowed = true;
            this._teleportBackwardsVector = new LIB.Vector3(0, -1, -1);
            this._isDefaultTeleportationTarget = true;
            this._teleportationFillColor = "#444444";
            this._teleportationBorderColor = "#FFFFFF";
            this._rotationAngle = 0;
            this._haloCenter = new LIB.Vector3(0, 0, 0);
            this._padSensibilityUp = 0.65;
            this._padSensibilityDown = 0.35;
            this.leftController = null;
            this.rightController = null;
            /**
             * Observable raised when a new mesh is selected based on meshSelectionPredicate
             */
            this.onNewMeshSelected = new LIB.Observable();
            /**
             * Observable raised when a new mesh is picked based on meshSelectionPredicate
             */
            this.onNewMeshPicked = new LIB.Observable();
            /**
             * Observable raised before camera teleportation
            */
            this.onBeforeCameraTeleport = new LIB.Observable();
            /**
             *  Observable raised after camera teleportation
            */
            this.onAfterCameraTeleport = new LIB.Observable();
            /**
            * Observable raised when current selected mesh gets unselected
            */
            this.onSelectedMeshUnselected = new LIB.Observable();
            /**
             * Set teleportation enabled. If set to false camera teleportation will be disabled but camera rotation will be kept.
             */
            this.teleportationEnabled = true;
            this._teleportationInitialized = false;
            this._interactionsEnabled = false;
            this._interactionsRequested = false;
            this._displayGaze = true;
            this._displayLaserPointer = true;
            this._onResize = function () {
                _this.moveButtonToBottomRight();
                if (_this._fullscreenVRpresenting && _this._webVRready) {
                    _this.exitVR();
                }
            };
            this._onFullscreenChange = function () {
                if (document.fullscreen !== undefined) {
                    _this._fullscreenVRpresenting = document.fullscreen;
                }
                else if (document.mozFullScreen !== undefined) {
                    _this._fullscreenVRpresenting = document.mozFullScreen;
                }
                else if (document.webkitIsFullScreen !== undefined) {
                    _this._fullscreenVRpresenting = document.webkitIsFullScreen;
                }
                else if (document.msIsFullScreen !== undefined) {
                    _this._fullscreenVRpresenting = document.msIsFullScreen;
                }
                if (!_this._fullscreenVRpresenting && _this._canvas) {
                    _this.exitVR();
                    if (!_this._useCustomVRButton) {
                        _this._btnVR.style.top = _this._canvas.offsetTop + _this._canvas.offsetHeight - 70 + "px";
                        _this._btnVR.style.left = _this._canvas.offsetLeft + _this._canvas.offsetWidth - 100 + "px";
                    }
                }
            };
            this.beforeRender = function () {
                if (_this.leftController && _this.leftController._activePointer) {
                    _this._castRayAndSelectObject(_this.leftController);
                }
                if (_this.rightController && _this.rightController._activePointer) {
                    _this._castRayAndSelectObject(_this.rightController);
                }
                if (!(_this.leftController && _this.leftController._activePointer) && !(_this.rightController && _this.rightController._activePointer)) {
                    _this._castRayAndSelectObject(_this._cameraGazer);
                }
                else {
                    _this._cameraGazer._gazeTracker.isVisible = false;
                }
            };
            this._onNewGamepadConnected = function (gamepad) {
                if (gamepad.type !== LIB.Gamepad.POSE_ENABLED) {
                    if (gamepad.leftStick) {
                        gamepad.onleftstickchanged(function (stickValues) {
                            if (_this._teleportationInitialized && _this.teleportationEnabled) {
                                // Listening to classic/xbox gamepad only if no VR controller is active
                                if ((!_this.leftController && !_this.rightController) ||
                                    ((_this.leftController && !_this.leftController._activePointer) &&
                                        (_this.rightController && !_this.rightController._activePointer))) {
                                    _this._checkTeleportWithRay(stickValues, _this._cameraGazer);
                                    _this._checkTeleportBackwards(stickValues, _this._cameraGazer);
                                }
                            }
                        });
                    }
                    if (gamepad.rightStick) {
                        gamepad.onrightstickchanged(function (stickValues) {
                            if (_this._teleportationInitialized) {
                                _this._checkRotate(stickValues, _this._cameraGazer);
                            }
                        });
                    }
                    if (gamepad.type === LIB.Gamepad.XBOX) {
                        gamepad.onbuttondown(function (buttonPressed) {
                            if (_this._interactionsEnabled && buttonPressed === LIB.Xbox360Button.A) {
                                _this._cameraGazer._selectionPointerDown();
                            }
                        });
                        gamepad.onbuttonup(function (buttonPressed) {
                            if (_this._interactionsEnabled && buttonPressed === LIB.Xbox360Button.A) {
                                _this._cameraGazer._selectionPointerUp();
                            }
                        });
                    }
                }
                else {
                    var webVRController = gamepad;
                    var controller = new VRExperienceHelperControllerGazer(webVRController, _this._scene, _this._cameraGazer._gazeTracker);
                    if (webVRController.hand === "right" || (_this.leftController && _this.leftController.webVRController != webVRController)) {
                        _this.rightController = controller;
                    }
                    else {
                        _this.leftController = controller;
                    }
                    _this._tryEnableInteractionOnController(controller);
                }
            };
            // This only succeeds if the controller's mesh exists for the controller so this must be called whenever new controller is connected or when mesh is loaded
            this._tryEnableInteractionOnController = function (controller) {
                if (_this._interactionsRequested && !controller._interactionsEnabled) {
                    _this._enableInteractionOnController(controller);
                }
                if (_this._teleportationRequested && !controller._teleportationEnabled) {
                    _this._enableTeleportationOnController(controller);
                }
            };
            this._onNewGamepadDisconnected = function (gamepad) {
                if (gamepad instanceof LIB.WebVRController) {
                    if (gamepad.hand === "left" && _this.leftController != null) {
                        _this.leftController.dispose();
                        _this.leftController = null;
                    }
                    if (gamepad.hand === "right" && _this.rightController != null) {
                        _this.rightController.dispose();
                        _this.rightController = null;
                    }
                }
            };
            this._workingVector = LIB.Vector3.Zero();
            this._workingQuaternion = LIB.Quaternion.Identity();
            this._workingMatrix = LIB.Matrix.Identity();
            this._scene = scene;
            this._canvas = scene.getEngine().getRenderingCanvas();
            // Parse options
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera === undefined) {
                webVROptions.createFallbackVRDeviceOrientationFreeCamera = true;
            }
            if (webVROptions.createDeviceOrientationCamera === undefined) {
                webVROptions.createDeviceOrientationCamera = true;
            }
            if (webVROptions.defaultHeight === undefined) {
                webVROptions.defaultHeight = 1.7;
            }
            if (webVROptions.useCustomVRButton) {
                this._useCustomVRButton = true;
                if (webVROptions.customVRButton) {
                    this._btnVR = webVROptions.customVRButton;
                }
            }
            if (webVROptions.rayLength) {
                this._rayLength = webVROptions.rayLength;
            }
            this._defaultHeight = webVROptions.defaultHeight;
            if (webVROptions.positionScale) {
                this._rayLength *= webVROptions.positionScale;
                this._defaultHeight *= webVROptions.positionScale;
            }
            // Set position
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            }
            else {
                this._position = new LIB.Vector3(0, this._defaultHeight, 0);
            }
            // Set non-vr camera
            if (webVROptions.createDeviceOrientationCamera || !this._scene.activeCamera) {
                this._deviceOrientationCamera = new LIB.DeviceOrientationCamera("deviceOrientationVRHelper", this._position.clone(), scene);
                // Copy data from existing camera
                if (this._scene.activeCamera) {
                    this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                    this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ;
                    // Set rotation from previous camera
                    if (this._scene.activeCamera instanceof LIB.TargetCamera && this._scene.activeCamera.rotation) {
                        var targetCamera = this._scene.activeCamera;
                        if (targetCamera.rotationQuaternion) {
                            this._deviceOrientationCamera.rotationQuaternion.copyFrom(targetCamera.rotationQuaternion);
                        }
                        else {
                            this._deviceOrientationCamera.rotationQuaternion.copyFrom(LIB.Quaternion.RotationYawPitchRoll(targetCamera.rotation.y, targetCamera.rotation.x, targetCamera.rotation.z));
                        }
                        this._deviceOrientationCamera.rotation = targetCamera.rotation.clone();
                    }
                }
                this._scene.activeCamera = this._deviceOrientationCamera;
                if (this._canvas) {
                    this._scene.activeCamera.attachControl(this._canvas);
                }
            }
            else {
                this._existingCamera = this._scene.activeCamera;
            }
            // Create VR cameras
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
                this._vrDeviceOrientationCamera = new LIB.VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene);
            }
            this._webVRCamera = new LIB.WebVRFreeCamera("WebVRHelper", this._position, this._scene, webVROptions);
            this._webVRCamera.useStandingMatrix();
            this._cameraGazer = new VRExperienceHelperCameraGazer(function () { return _this.currentVRCamera; }, scene);
            // Create default button
            if (!this._useCustomVRButton) {
                this._btnVR = document.createElement("BUTTON");
                this._btnVR.className = "LIBVRicon";
                this._btnVR.id = "LIBVRiconbtn";
                this._btnVR.title = "Click to switch to VR";
                var css = ".LIBVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .LIBVRicon:hover { transform: scale(1.05) } .LIBVRicon:active {background-color: rgba(51,51,51,1) } .LIBVRicon:focus {background-color: rgba(51,51,51,1) }";
                css += ".LIBVRicon.vrdisplaypresenting { display: none; }";
                // TODO: Add user feedback so that they know what state the VRDisplay is in (disconnected, connected, entering-VR)
                // css += ".LIBVRicon.vrdisplaysupported { }";
                // css += ".LIBVRicon.vrdisplayready { }";
                // css += ".LIBVRicon.vrdisplayrequesting { }";
                var style = document.createElement('style');
                style.appendChild(document.createTextNode(css));
                document.getElementsByTagName('head')[0].appendChild(style);
                this.moveButtonToBottomRight();
            }
            // VR button click event
            if (this._btnVR) {
                this._btnVR.addEventListener("click", function () {
                    if (!_this.isInVRMode) {
                        _this.enterVR();
                    }
                    else {
                        _this.exitVR();
                    }
                });
            }
            // Window events
            window.addEventListener("resize", this._onResize);
            document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);
            // Display vr button when headset is connected
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
                this.displayVRButton();
            }
            else {
                this._scene.getEngine().onVRDisplayChangedObservable.add(function (e) {
                    if (e.vrDisplay) {
                        _this.displayVRButton();
                    }
                });
            }
            // Exiting VR mode using 'ESC' key on desktop
            this._onKeyDown = function (event) {
                if (event.keyCode === 27 && _this.isInVRMode) {
                    _this.exitVR();
                }
            };
            document.addEventListener("keydown", this._onKeyDown);
            // Exiting VR mode double tapping the touch screen
            this._scene.onPrePointerObservable.add(function (pointerInfo, eventState) {
                if (_this.isInVRMode) {
                    _this.exitVR();
                    if (_this._fullscreenVRpresenting) {
                        _this._scene.getEngine().switchFullscreen(true);
                    }
                }
            }, LIB.PointerEventTypes.POINTERDOUBLETAP, false);
            // Listen for WebVR display changes
            this._onVRDisplayChanged = function (eventArgs) { return _this.onVRDisplayChanged(eventArgs); };
            this._onVrDisplayPresentChange = function () { return _this.onVrDisplayPresentChange(); };
            this._onVRRequestPresentStart = function () {
                _this._webVRrequesting = true;
                _this.updateButtonVisibility();
            };
            this._onVRRequestPresentComplete = function (success) {
                _this._webVRrequesting = false;
                _this.updateButtonVisibility();
            };
            scene.getEngine().onVRDisplayChangedObservable.add(this._onVRDisplayChanged);
            scene.getEngine().onVRRequestPresentStart.add(this._onVRRequestPresentStart);
            scene.getEngine().onVRRequestPresentComplete.add(this._onVRRequestPresentComplete);
            window.addEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            scene.onDisposeObservable.add(function () {
                _this.dispose();
            });
            // Gamepad connection events
            this._webVRCamera.onControllerMeshLoadedObservable.add(function (webVRController) { return _this._onDefaultMeshLoaded(webVRController); });
            this._scene.gamepadManager.onGamepadConnectedObservable.add(this._onNewGamepadConnected);
            this._scene.gamepadManager.onGamepadDisconnectedObservable.add(this._onNewGamepadDisconnected);
            this.updateButtonVisibility();
            //create easing functions
            this._circleEase = new LIB.CircleEase();
            this._circleEase.setEasingMode(LIB.EasingFunction.EASINGMODE_EASEINOUT);
        }
        Object.defineProperty(VRExperienceHelper.prototype, "onEnteringVR", {
            /** Return this.onEnteringVRObservable
             * Note: This one is for backward compatibility. Please use onEnteringVRObservable directly
             */
            get: function () {
                return this.onEnteringVRObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "onExitingVR", {
            /** Return this.onExitingVRObservable
             * Note: This one is for backward compatibility. Please use onExitingVRObservable directly
             */
            get: function () {
                return this.onExitingVRObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "onControllerMeshLoaded", {
            /** Return this.onControllerMeshLoadedObservable
             * Note: This one is for backward compatibility. Please use onControllerMeshLoadedObservable directly
             */
            get: function () {
                return this.onControllerMeshLoadedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "teleportationTarget", {
            /**
             * The mesh used to display where the user is going to teleport.
             */
            get: function () {
                return this._teleportationTarget;
            },
            /**
             * Sets the mesh to be used to display where the user is going to teleport.
             */
            set: function (value) {
                if (value) {
                    value.name = "teleportationTarget";
                    this._isDefaultTeleportationTarget = false;
                    this._teleportationTarget = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "gazeTrackerMesh", {
            /**
             * The mesh used to display where the user is selecting,
             * when set bakeCurrentTransformIntoVertices will be called on the mesh.
             * See http://doc.LIBjs.com/resources/baking_transformations
             */
            get: function () {
                return this._cameraGazer._gazeTracker;
            },
            set: function (value) {
                if (value) {
                    this._cameraGazer._gazeTracker = value;
                    this._cameraGazer._gazeTracker.bakeCurrentTransformIntoVertices();
                    this._cameraGazer._gazeTracker.isPickable = false;
                    this._cameraGazer._gazeTracker.isVisible = false;
                    this._cameraGazer._gazeTracker.name = "gazeTracker";
                    if (this.leftController) {
                        this.leftController._gazeTracker = this._cameraGazer._gazeTracker.clone("gazeTracker");
                    }
                    if (this.rightController) {
                        this.rightController._gazeTracker = this._cameraGazer._gazeTracker.clone("gazeTracker");
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "displayGaze", {
            /**
             * If the ray of the gaze should be displayed.
             */
            get: function () {
                return this._displayGaze;
            },
            /**
             * Sets if the ray of the gaze should be displayed.
             */
            set: function (value) {
                this._displayGaze = value;
                if (!value) {
                    this._cameraGazer._gazeTracker.isVisible = false;
                    if (this.leftController) {
                        this.leftController._gazeTracker.isVisible = false;
                    }
                    if (this.rightController) {
                        this.rightController._gazeTracker.isVisible = false;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "displayLaserPointer", {
            /**
             * If the ray of the LaserPointer should be displayed.
             */
            get: function () {
                return this._displayLaserPointer;
            },
            /**
             * Sets if the ray of the LaserPointer should be displayed.
             */
            set: function (value) {
                this._displayLaserPointer = value;
                if (!value) {
                    if (this.rightController) {
                        this.rightController._deactivatePointer();
                        this.rightController._gazeTracker.isVisible = false;
                    }
                    if (this.leftController) {
                        this.leftController._deactivatePointer();
                        this.leftController._gazeTracker.isVisible = false;
                    }
                }
                else {
                    if (this.rightController) {
                        this.rightController._activatePointer();
                    }
                    if (this.leftController) {
                        this.leftController._activatePointer();
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "deviceOrientationCamera", {
            /**
             * The deviceOrientationCamera used as the camera when not in VR.
             */
            get: function () {
                return this._deviceOrientationCamera;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "currentVRCamera", {
            /**
             * Based on the current WebVR support, returns the current VR camera used.
             */
            get: function () {
                if (this._webVRready) {
                    return this._webVRCamera;
                }
                else {
                    return this._scene.activeCamera;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "webVRCamera", {
            /**
             * The webVRCamera which is used when in VR.
             */
            get: function () {
                return this._webVRCamera;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "vrDeviceOrientationCamera", {
            /**
             * The deviceOrientationCamera that is used as a fallback when vr device is not connected.
             */
            get: function () {
                return this._vrDeviceOrientationCamera;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "_teleportationRequestInitiated", {
            get: function () {
                var result = this._cameraGazer._teleportationRequestInitiated
                    || (this.leftController !== null && this.leftController._teleportationRequestInitiated)
                    || (this.rightController !== null && this.rightController._teleportationRequestInitiated);
                return result;
            },
            enumerable: true,
            configurable: true
        });
        // Raised when one of the controller has loaded successfully its associated default mesh
        VRExperienceHelper.prototype._onDefaultMeshLoaded = function (webVRController) {
            if (this.leftController && this.leftController.webVRController == webVRController) {
                if (webVRController.mesh) {
                    this.leftController._setLaserPointerParent(webVRController.mesh);
                }
            }
            if (this.rightController && this.rightController.webVRController == webVRController) {
                if (webVRController.mesh) {
                    this.rightController._setLaserPointerParent(webVRController.mesh);
                }
            }
            try {
                this.onControllerMeshLoadedObservable.notifyObservers(webVRController);
            }
            catch (err) {
                LIB.Tools.Warn("Error in your custom logic onControllerMeshLoaded: " + err);
            }
        };
        Object.defineProperty(VRExperienceHelper.prototype, "isInVRMode", {
            /**
             * Gets a value indicating if we are currently in VR mode.
             */
            get: function () {
                return this._webVRpresenting || this._fullscreenVRpresenting;
            },
            enumerable: true,
            configurable: true
        });
        VRExperienceHelper.prototype.onVrDisplayPresentChange = function () {
            var vrDisplay = this._scene.getEngine().getVRDevice();
            if (vrDisplay) {
                var wasPresenting = this._webVRpresenting;
                // A VR display is connected
                this._webVRpresenting = vrDisplay.isPresenting;
                if (wasPresenting && !this._webVRpresenting)
                    this.exitVR();
            }
            else {
                LIB.Tools.Warn('Detected VRDisplayPresentChange on an unknown VRDisplay. Did you can enterVR on the vrExperienceHelper?');
            }
            this.updateButtonVisibility();
        };
        VRExperienceHelper.prototype.onVRDisplayChanged = function (eventArgs) {
            this._webVRsupported = eventArgs.vrSupported;
            this._webVRready = !!eventArgs.vrDisplay;
            this._webVRpresenting = eventArgs.vrDisplay && eventArgs.vrDisplay.isPresenting;
            this.updateButtonVisibility();
        };
        VRExperienceHelper.prototype.moveButtonToBottomRight = function () {
            if (this._canvas && !this._useCustomVRButton) {
                this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
            }
        };
        VRExperienceHelper.prototype.displayVRButton = function () {
            if (!this._useCustomVRButton && !this._btnVRDisplayed) {
                document.body.appendChild(this._btnVR);
                this._btnVRDisplayed = true;
            }
        };
        VRExperienceHelper.prototype.updateButtonVisibility = function () {
            if (!this._btnVR || this._useCustomVRButton) {
                return;
            }
            this._btnVR.className = "LIBVRicon";
            if (this.isInVRMode) {
                this._btnVR.className += " vrdisplaypresenting";
            }
            else {
                if (this._webVRready)
                    this._btnVR.className += " vrdisplayready";
                if (this._webVRsupported)
                    this._btnVR.className += " vrdisplaysupported";
                if (this._webVRrequesting)
                    this._btnVR.className += " vrdisplayrequesting";
            }
        };
        /**
         * Attempt to enter VR. If a headset is connected and ready, will request present on that.
         * Otherwise, will use the fullscreen API.
         */
        VRExperienceHelper.prototype.enterVR = function () {
            if (this.onEnteringVRObservable) {
                try {
                    this.onEnteringVRObservable.notifyObservers(this);
                }
                catch (err) {
                    LIB.Tools.Warn("Error in your custom logic onEnteringVR: " + err);
                }
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
                // make sure that we return to the last active camera
                this._existingCamera = this._scene.activeCamera;
            }
            if (this._webVRrequesting)
                return;
            // If WebVR is supported and a headset is connected
            if (this._webVRready) {
                if (!this._webVRpresenting) {
                    this._webVRCamera.position = this._position;
                    this._scene.activeCamera = this._webVRCamera;
                }
            }
            else if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.position = this._position;
                if (this._scene.activeCamera) {
                    this._vrDeviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                }
                this._scene.activeCamera = this._vrDeviceOrientationCamera;
                this._scene.getEngine().switchFullscreen(true);
                this.updateButtonVisibility();
            }
            if (this._scene.activeCamera && this._canvas) {
                this._scene.activeCamera.attachControl(this._canvas);
            }
            if (this._interactionsEnabled) {
                this._scene.registerBeforeRender(this.beforeRender);
            }
        };
        /**
         * Attempt to exit VR, or fullscreen.
         */
        VRExperienceHelper.prototype.exitVR = function () {
            if (this.onExitingVRObservable) {
                try {
                    this.onExitingVRObservable.notifyObservers(this);
                }
                catch (err) {
                    LIB.Tools.Warn("Error in your custom logic onExitingVR: " + err);
                }
            }
            if (this._webVRpresenting) {
                this._scene.getEngine().disableVR();
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            }
            if (this._deviceOrientationCamera) {
                this._deviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._deviceOrientationCamera;
                if (this._canvas) {
                    this._scene.activeCamera.attachControl(this._canvas);
                }
            }
            else if (this._existingCamera) {
                this._existingCamera.position = this._position;
                this._scene.activeCamera = this._existingCamera;
            }
            this.updateButtonVisibility();
            if (this._interactionsEnabled) {
                this._scene.unregisterBeforeRender(this.beforeRender);
            }
            // resize to update width and height when exiting vr exits fullscreen
            this._scene.getEngine().resize();
        };
        Object.defineProperty(VRExperienceHelper.prototype, "position", {
            /**
             * The position of the vr experience helper.
             */
            get: function () {
                return this._position;
            },
            /**
             * Sets the position of the vr experience helper.
             */
            set: function (value) {
                this._position = value;
                if (this._scene.activeCamera) {
                    this._scene.activeCamera.position = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Enables controllers and user interactions suck as selecting and object or clicking on an object.
         */
        VRExperienceHelper.prototype.enableInteractions = function () {
            var _this = this;
            if (!this._interactionsEnabled) {
                this._interactionsRequested = true;
                if (this.leftController) {
                    this._enableInteractionOnController(this.leftController);
                }
                if (this.rightController) {
                    this._enableInteractionOnController(this.rightController);
                }
                this.raySelectionPredicate = function (mesh) {
                    return mesh.isVisible;
                };
                this.meshSelectionPredicate = function (mesh) {
                    return true;
                };
                this._raySelectionPredicate = function (mesh) {
                    if (_this._isTeleportationFloor(mesh) || (mesh.name.indexOf("gazeTracker") === -1
                        && mesh.name.indexOf("teleportationTarget") === -1
                        && mesh.name.indexOf("torusTeleportation") === -1
                        && mesh.name.indexOf("laserPointer") === -1)) {
                        return _this.raySelectionPredicate(mesh);
                    }
                    return false;
                };
                this._interactionsEnabled = true;
            }
        };
        VRExperienceHelper.prototype._isTeleportationFloor = function (mesh) {
            for (var i = 0; i < this._floorMeshesCollection.length; i++) {
                if (this._floorMeshesCollection[i].id === mesh.id) {
                    return true;
                }
            }
            if (this._floorMeshName && mesh.name === this._floorMeshName) {
                return true;
            }
            return false;
        };
        /**
         * Adds a floor mesh to be used for teleportation.
         * @param floorMesh the mesh to be used for teleportation.
         */
        VRExperienceHelper.prototype.addFloorMesh = function (floorMesh) {
            if (!this._floorMeshesCollection) {
                return;
            }
            if (this._floorMeshesCollection.indexOf(floorMesh) > -1) {
                return;
            }
            this._floorMeshesCollection.push(floorMesh);
        };
        /**
         * Removes a floor mesh from being used for teleportation.
         * @param floorMesh the mesh to be removed.
         */
        VRExperienceHelper.prototype.removeFloorMesh = function (floorMesh) {
            if (!this._floorMeshesCollection) {
                return;
            }
            var meshIndex = this._floorMeshesCollection.indexOf(floorMesh);
            if (meshIndex !== -1) {
                this._floorMeshesCollection.splice(meshIndex, 1);
            }
        };
        /**
         * Enables interactions and teleportation using the VR controllers and gaze.
         * @param vrTeleportationOptions options to modify teleportation behavior.
         */
        VRExperienceHelper.prototype.enableTeleportation = function (vrTeleportationOptions) {
            if (vrTeleportationOptions === void 0) { vrTeleportationOptions = {}; }
            if (!this._teleportationInitialized) {
                this._teleportationRequested = true;
                this.enableInteractions();
                if (vrTeleportationOptions.floorMeshName) {
                    this._floorMeshName = vrTeleportationOptions.floorMeshName;
                }
                if (vrTeleportationOptions.floorMeshes) {
                    this._floorMeshesCollection = vrTeleportationOptions.floorMeshes;
                }
                if (this.leftController != null) {
                    this._enableTeleportationOnController(this.leftController);
                }
                if (this.rightController != null) {
                    this._enableTeleportationOnController(this.rightController);
                }
                // Creates an image processing post process for the vignette not relying
                // on the main scene configuration for image processing to reduce setup and spaces 
                // (gamma/linear) conflicts.
                var imageProcessingConfiguration = new LIB.ImageProcessingConfiguration();
                imageProcessingConfiguration.vignetteColor = new LIB.Color4(0, 0, 0, 0);
                imageProcessingConfiguration.vignetteEnabled = true;
                this._postProcessMove = new LIB.ImageProcessingPostProcess("postProcessMove", 1.0, this._webVRCamera, undefined, undefined, undefined, undefined, imageProcessingConfiguration);
                this._webVRCamera.detachPostProcess(this._postProcessMove);
                this._teleportationInitialized = true;
                if (this._isDefaultTeleportationTarget) {
                    this._createTeleportationCircles();
                    this._teleportationTarget.scaling.scaleInPlace(this._webVRCamera.deviceScaleFactor);
                }
            }
        };
        VRExperienceHelper.prototype._enableInteractionOnController = function (controller) {
            var _this = this;
            var controllerMesh = controller.webVRController.mesh;
            if (controllerMesh) {
                controller._interactionsEnabled = true;
                controller._activatePointer();
                controller.webVRController.onMainButtonStateChangedObservable.add(function (stateObject) {
                    // Enabling / disabling laserPointer 
                    if (_this._displayLaserPointer && stateObject.value === 1) {
                        if (controller._activePointer) {
                            controller._deactivatePointer();
                        }
                        else {
                            controller._activatePointer();
                        }
                        if (_this.displayGaze) {
                            controller._gazeTracker.isVisible = controller._activePointer;
                        }
                    }
                });
                controller.webVRController.onTriggerStateChangedObservable.add(function (stateObject) {
                    if (!controller._pointerDownOnMeshAsked) {
                        if (stateObject.value > _this._padSensibilityUp) {
                            controller._selectionPointerDown();
                        }
                    }
                    else if (stateObject.value < _this._padSensibilityDown) {
                        controller._selectionPointerUp();
                    }
                });
            }
        };
        VRExperienceHelper.prototype._checkTeleportWithRay = function (stateObject, gazer) {
            // Dont teleport if another gaze already requested teleportation
            if (this._teleportationRequestInitiated && !gazer._teleportationRequestInitiated) {
                return;
            }
            if (!gazer._teleportationRequestInitiated) {
                if (stateObject.y < -this._padSensibilityUp && gazer._dpadPressed) {
                    gazer._activatePointer();
                    gazer._teleportationRequestInitiated = true;
                }
            }
            else {
                // Listening to the proper controller values changes to confirm teleportation
                if (Math.sqrt(stateObject.y * stateObject.y + stateObject.x * stateObject.x) < this._padSensibilityDown) {
                    if (this._teleportActive) {
                        this._teleportCamera(this._haloCenter);
                    }
                    gazer._teleportationRequestInitiated = false;
                }
            }
        };
        VRExperienceHelper.prototype._checkRotate = function (stateObject, gazer) {
            // Only rotate when user is not currently selecting a teleportation location
            if (gazer._teleportationRequestInitiated) {
                return;
            }
            if (!gazer._rotationLeftAsked) {
                if (stateObject.x < -this._padSensibilityUp && gazer._dpadPressed) {
                    gazer._rotationLeftAsked = true;
                    if (this._rotationAllowed) {
                        this._rotateCamera(false);
                    }
                }
            }
            else {
                if (stateObject.x > -this._padSensibilityDown) {
                    gazer._rotationLeftAsked = false;
                }
            }
            if (!gazer._rotationRightAsked) {
                if (stateObject.x > this._padSensibilityUp && gazer._dpadPressed) {
                    gazer._rotationRightAsked = true;
                    if (this._rotationAllowed) {
                        this._rotateCamera(true);
                    }
                }
            }
            else {
                if (stateObject.x < this._padSensibilityDown) {
                    gazer._rotationRightAsked = false;
                }
            }
        };
        VRExperienceHelper.prototype._checkTeleportBackwards = function (stateObject, gazer) {
            // Only teleport backwards when user is not currently selecting a teleportation location
            if (gazer._teleportationRequestInitiated) {
                return;
            }
            // Teleport backwards
            if (stateObject.y > this._padSensibilityUp && gazer._dpadPressed) {
                if (!gazer._teleportationBackRequestInitiated) {
                    if (!this.currentVRCamera) {
                        return;
                    }
                    // Get rotation and position of the current camera
                    var rotation = LIB.Quaternion.FromRotationMatrix(this.currentVRCamera.getWorldMatrix().getRotationMatrix());
                    var position = this.currentVRCamera.position;
                    // If the camera has device position, use that instead
                    if (this.currentVRCamera.devicePosition && this.currentVRCamera.deviceRotationQuaternion) {
                        rotation = this.currentVRCamera.deviceRotationQuaternion;
                        position = this.currentVRCamera.devicePosition;
                    }
                    // Get matrix with only the y rotation of the device rotation
                    rotation.toEulerAnglesToRef(this._workingVector);
                    this._workingVector.z = 0;
                    this._workingVector.x = 0;
                    LIB.Quaternion.RotationYawPitchRollToRef(this._workingVector.y, this._workingVector.x, this._workingVector.z, this._workingQuaternion);
                    this._workingQuaternion.toRotationMatrix(this._workingMatrix);
                    // Rotate backwards ray by device rotation to cast at the ground behind the user
                    LIB.Vector3.TransformCoordinatesToRef(this._teleportBackwardsVector, this._workingMatrix, this._workingVector);
                    // Teleport if ray hit the ground and is not to far away eg. backwards off a cliff
                    var ray = new LIB.Ray(position, this._workingVector);
                    var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);
                    if (hit && hit.pickedPoint && hit.pickedMesh && this._isTeleportationFloor(hit.pickedMesh) && hit.distance < 5) {
                        this._teleportCamera(hit.pickedPoint);
                    }
                    gazer._teleportationBackRequestInitiated = true;
                }
            }
            else {
                gazer._teleportationBackRequestInitiated = false;
            }
        };
        VRExperienceHelper.prototype._enableTeleportationOnController = function (controller) {
            var _this = this;
            var controllerMesh = controller.webVRController.mesh;
            if (controllerMesh) {
                if (!controller._interactionsEnabled) {
                    this._enableInteractionOnController(controller);
                }
                controller._interactionsEnabled = true;
                controller._teleportationEnabled = true;
                if (controller.webVRController.controllerType === LIB.PoseEnabledControllerType.VIVE) {
                    controller._dpadPressed = false;
                    controller.webVRController.onPadStateChangedObservable.add(function (stateObject) {
                        controller._dpadPressed = stateObject.pressed;
                        if (!controller._dpadPressed) {
                            controller._rotationLeftAsked = false;
                            controller._rotationRightAsked = false;
                            controller._teleportationBackRequestInitiated = false;
                        }
                    });
                }
                controller.webVRController.onPadValuesChangedObservable.add(function (stateObject) {
                    if (_this.teleportationEnabled) {
                        _this._checkTeleportBackwards(stateObject, controller);
                        _this._checkTeleportWithRay(stateObject, controller);
                    }
                    _this._checkRotate(stateObject, controller);
                });
            }
        };
        VRExperienceHelper.prototype._createTeleportationCircles = function () {
            this._teleportationTarget = LIB.Mesh.CreateGround("teleportationTarget", 2, 2, 2, this._scene);
            this._teleportationTarget.isPickable = false;
            var length = 512;
            var dynamicTexture = new LIB.DynamicTexture("DynamicTexture", length, this._scene, true);
            dynamicTexture.hasAlpha = true;
            var context = dynamicTexture.getContext();
            var centerX = length / 2;
            var centerY = length / 2;
            var radius = 200;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = this._teleportationFillColor;
            context.fill();
            context.lineWidth = 10;
            context.strokeStyle = this._teleportationBorderColor;
            context.stroke();
            context.closePath();
            dynamicTexture.update();
            var teleportationCircleMaterial = new LIB.StandardMaterial("TextPlaneMaterial", this._scene);
            teleportationCircleMaterial.diffuseTexture = dynamicTexture;
            this._teleportationTarget.material = teleportationCircleMaterial;
            var torus = LIB.Mesh.CreateTorus("torusTeleportation", 0.75, 0.1, 25, this._scene, false);
            torus.isPickable = false;
            torus.parent = this._teleportationTarget;
            var animationInnerCircle = new LIB.Animation("animationInnerCircle", "position.y", 30, LIB.Animation.ANIMATIONTYPE_FLOAT, LIB.Animation.ANIMATIONLOOPMODE_CYCLE);
            var keys = [];
            keys.push({
                frame: 0,
                value: 0
            });
            keys.push({
                frame: 30,
                value: 0.4
            });
            keys.push({
                frame: 60,
                value: 0
            });
            animationInnerCircle.setKeys(keys);
            var easingFunction = new LIB.SineEase();
            easingFunction.setEasingMode(LIB.EasingFunction.EASINGMODE_EASEINOUT);
            animationInnerCircle.setEasingFunction(easingFunction);
            torus.animations = [];
            torus.animations.push(animationInnerCircle);
            this._scene.beginAnimation(torus, 0, 60, true);
            this._hideTeleportationTarget();
        };
        VRExperienceHelper.prototype._displayTeleportationTarget = function () {
            this._teleportActive = true;
            if (this._teleportationInitialized) {
                this._teleportationTarget.isVisible = true;
                if (this._isDefaultTeleportationTarget) {
                    this._teleportationTarget.getChildren()[0].isVisible = true;
                }
            }
        };
        VRExperienceHelper.prototype._hideTeleportationTarget = function () {
            this._teleportActive = false;
            if (this._teleportationInitialized) {
                this._teleportationTarget.isVisible = false;
                if (this._isDefaultTeleportationTarget) {
                    this._teleportationTarget.getChildren()[0].isVisible = false;
                }
            }
        };
        VRExperienceHelper.prototype._rotateCamera = function (right) {
            var _this = this;
            if (!(this.currentVRCamera instanceof LIB.FreeCamera)) {
                return;
            }
            if (right) {
                this._rotationAngle++;
            }
            else {
                this._rotationAngle--;
            }
            this.currentVRCamera.animations = [];
            var target = LIB.Quaternion.FromRotationMatrix(LIB.Matrix.RotationY(Math.PI / 4 * this._rotationAngle));
            var animationRotation = new LIB.Animation("animationRotation", "rotationQuaternion", 90, LIB.Animation.ANIMATIONTYPE_QUATERNION, LIB.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var animationRotationKeys = [];
            animationRotationKeys.push({
                frame: 0,
                value: this.currentVRCamera.rotationQuaternion
            });
            animationRotationKeys.push({
                frame: 6,
                value: target
            });
            animationRotation.setKeys(animationRotationKeys);
            animationRotation.setEasingFunction(this._circleEase);
            this.currentVRCamera.animations.push(animationRotation);
            this._postProcessMove.animations = [];
            var animationPP = new LIB.Animation("animationPP", "vignetteWeight", 90, LIB.Animation.ANIMATIONTYPE_FLOAT, LIB.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteWeightKeys = [];
            vignetteWeightKeys.push({
                frame: 0,
                value: 0
            });
            vignetteWeightKeys.push({
                frame: 3,
                value: 4
            });
            vignetteWeightKeys.push({
                frame: 6,
                value: 0
            });
            animationPP.setKeys(vignetteWeightKeys);
            animationPP.setEasingFunction(this._circleEase);
            this._postProcessMove.animations.push(animationPP);
            var animationPP2 = new LIB.Animation("animationPP2", "vignetteStretch", 90, LIB.Animation.ANIMATIONTYPE_FLOAT, LIB.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteStretchKeys = [];
            vignetteStretchKeys.push({
                frame: 0,
                value: 0
            });
            vignetteStretchKeys.push({
                frame: 3,
                value: 10
            });
            vignetteStretchKeys.push({
                frame: 6,
                value: 0
            });
            animationPP2.setKeys(vignetteStretchKeys);
            animationPP2.setEasingFunction(this._circleEase);
            this._postProcessMove.animations.push(animationPP2);
            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;
            this._postProcessMove.samples = 4;
            this._webVRCamera.attachPostProcess(this._postProcessMove);
            this._scene.beginAnimation(this._postProcessMove, 0, 6, false, 1, function () {
                _this._webVRCamera.detachPostProcess(_this._postProcessMove);
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 6, false, 1);
        };
        VRExperienceHelper.prototype._moveTeleportationSelectorTo = function (hit, gazer, ray) {
            if (hit.pickedPoint) {
                if (gazer._teleportationRequestInitiated) {
                    this._displayTeleportationTarget();
                    this._haloCenter.copyFrom(hit.pickedPoint);
                    this._teleportationTarget.position.copyFrom(hit.pickedPoint);
                }
                var pickNormal = this._convertNormalToDirectionOfRay(hit.getNormal(true, false), ray);
                if (pickNormal) {
                    var axis1 = LIB.Vector3.Cross(LIB.Axis.Y, pickNormal);
                    var axis2 = LIB.Vector3.Cross(pickNormal, axis1);
                    LIB.Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._teleportationTarget.rotation);
                }
                this._teleportationTarget.position.y += 0.1;
            }
        };
        VRExperienceHelper.prototype._teleportCamera = function (location) {
            var _this = this;
            if (!(this.currentVRCamera instanceof LIB.FreeCamera)) {
                return;
            }
            // Teleport the hmd to where the user is looking by moving the anchor to where they are looking minus the
            // offset of the headset from the anchor.
            if (this.webVRCamera.leftCamera) {
                this._workingVector.copyFrom(this.webVRCamera.leftCamera.globalPosition);
                this._workingVector.subtractInPlace(this.webVRCamera.position);
                location.subtractToRef(this._workingVector, this._workingVector);
            }
            else {
                this._workingVector.copyFrom(location);
            }
            // Add height to account for user's height offset
            if (this.isInVRMode) {
                this._workingVector.y += this.webVRCamera.deviceDistanceToRoomGround() * this._webVRCamera.deviceScaleFactor;
            }
            else {
                this._workingVector.y += this._defaultHeight;
            }
            this.onBeforeCameraTeleport.notifyObservers(this._workingVector);
            // Create animation from the camera's position to the new location
            this.currentVRCamera.animations = [];
            var animationCameraTeleportation = new LIB.Animation("animationCameraTeleportation", "position", 90, LIB.Animation.ANIMATIONTYPE_VECTOR3, LIB.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var animationCameraTeleportationKeys = [{
                    frame: 0,
                    value: this.currentVRCamera.position
                },
                {
                    frame: 11,
                    value: this._workingVector
                }
            ];
            animationCameraTeleportation.setKeys(animationCameraTeleportationKeys);
            animationCameraTeleportation.setEasingFunction(this._circleEase);
            this.currentVRCamera.animations.push(animationCameraTeleportation);
            this._postProcessMove.animations = [];
            var animationPP = new LIB.Animation("animationPP", "vignetteWeight", 90, LIB.Animation.ANIMATIONTYPE_FLOAT, LIB.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteWeightKeys = [];
            vignetteWeightKeys.push({
                frame: 0,
                value: 0
            });
            vignetteWeightKeys.push({
                frame: 5,
                value: 8
            });
            vignetteWeightKeys.push({
                frame: 11,
                value: 0
            });
            animationPP.setKeys(vignetteWeightKeys);
            this._postProcessMove.animations.push(animationPP);
            var animationPP2 = new LIB.Animation("animationPP2", "vignetteStretch", 90, LIB.Animation.ANIMATIONTYPE_FLOAT, LIB.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteStretchKeys = [];
            vignetteStretchKeys.push({
                frame: 0,
                value: 0
            });
            vignetteStretchKeys.push({
                frame: 5,
                value: 10
            });
            vignetteStretchKeys.push({
                frame: 11,
                value: 0
            });
            animationPP2.setKeys(vignetteStretchKeys);
            this._postProcessMove.animations.push(animationPP2);
            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;
            this._webVRCamera.attachPostProcess(this._postProcessMove);
            this._scene.beginAnimation(this._postProcessMove, 0, 11, false, 1, function () {
                _this._webVRCamera.detachPostProcess(_this._postProcessMove);
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 11, false, 1, function () {
                _this.onAfterCameraTeleport.notifyObservers(_this._workingVector);
            });
            this._hideTeleportationTarget();
        };
        VRExperienceHelper.prototype._convertNormalToDirectionOfRay = function (normal, ray) {
            if (normal) {
                var angle = Math.acos(LIB.Vector3.Dot(normal, ray.direction));
                if (angle < Math.PI / 2) {
                    normal.scaleInPlace(-1);
                }
            }
            return normal;
        };
        VRExperienceHelper.prototype._castRayAndSelectObject = function (gazer) {
            if (!(this.currentVRCamera instanceof LIB.FreeCamera)) {
                return;
            }
            var ray = gazer._getForwardRay(this._rayLength);
            var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);
            // Moving the gazeTracker on the mesh face targetted
            if (hit && hit.pickedPoint) {
                if (this._displayGaze) {
                    var multiplier = 1;
                    gazer._gazeTracker.isVisible = true;
                    if (gazer._isActionableMesh) {
                        multiplier = 3;
                    }
                    gazer._gazeTracker.scaling.x = hit.distance * multiplier;
                    gazer._gazeTracker.scaling.y = hit.distance * multiplier;
                    gazer._gazeTracker.scaling.z = hit.distance * multiplier;
                    var pickNormal = this._convertNormalToDirectionOfRay(hit.getNormal(), ray);
                    // To avoid z-fighting
                    var deltaFighting = 0.002;
                    if (pickNormal) {
                        var axis1 = LIB.Vector3.Cross(LIB.Axis.Y, pickNormal);
                        var axis2 = LIB.Vector3.Cross(pickNormal, axis1);
                        LIB.Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, gazer._gazeTracker.rotation);
                    }
                    gazer._gazeTracker.position.copyFrom(hit.pickedPoint);
                    if (gazer._gazeTracker.position.x < 0) {
                        gazer._gazeTracker.position.x += deltaFighting;
                    }
                    else {
                        gazer._gazeTracker.position.x -= deltaFighting;
                    }
                    if (gazer._gazeTracker.position.y < 0) {
                        gazer._gazeTracker.position.y += deltaFighting;
                    }
                    else {
                        gazer._gazeTracker.position.y -= deltaFighting;
                    }
                    if (gazer._gazeTracker.position.z < 0) {
                        gazer._gazeTracker.position.z += deltaFighting;
                    }
                    else {
                        gazer._gazeTracker.position.z -= deltaFighting;
                    }
                }
                // Changing the size of the laser pointer based on the distance from the targetted point
                gazer._updatePointerDistance(hit.distance);
            }
            else {
                gazer._updatePointerDistance();
                gazer._gazeTracker.isVisible = false;
            }
            if (hit && hit.pickedMesh) {
                gazer._currentHit = hit;
                if (gazer._pointerDownOnMeshAsked) {
                    this._scene.simulatePointerMove(gazer._currentHit, { pointerId: gazer._id });
                }
                // The object selected is the floor, we're in a teleportation scenario
                if (this._teleportationInitialized && this._isTeleportationFloor(hit.pickedMesh) && hit.pickedPoint) {
                    // Moving the teleportation area to this targetted point
                    //Raise onSelectedMeshUnselected observable if ray collided floor mesh/meshes and a non floor mesh was previously selected
                    if (gazer._currentMeshSelected && !this._isTeleportationFloor(gazer._currentMeshSelected)) {
                        this._notifySelectedMeshUnselected(gazer._currentMeshSelected);
                    }
                    gazer._currentMeshSelected = null;
                    if (gazer._teleportationRequestInitiated) {
                        this._moveTeleportationSelectorTo(hit, gazer, ray);
                    }
                    return;
                }
                // If not, we're in a selection scenario
                //this._teleportationAllowed = false;
                if (hit.pickedMesh !== gazer._currentMeshSelected) {
                    if (this.meshSelectionPredicate(hit.pickedMesh)) {
                        this.onNewMeshPicked.notifyObservers(hit);
                        gazer._currentMeshSelected = hit.pickedMesh;
                        if (hit.pickedMesh.isPickable && hit.pickedMesh.actionManager) {
                            this.changeGazeColor(new LIB.Color3(0, 0, 1));
                            this.changeLaserColor(new LIB.Color3(0.2, 0.2, 1));
                            gazer._isActionableMesh = true;
                        }
                        else {
                            this.changeGazeColor(new LIB.Color3(0.7, 0.7, 0.7));
                            this.changeLaserColor(new LIB.Color3(0.7, 0.7, 0.7));
                            gazer._isActionableMesh = false;
                        }
                        try {
                            this.onNewMeshSelected.notifyObservers(hit.pickedMesh);
                        }
                        catch (err) {
                            LIB.Tools.Warn("Error in your custom logic onNewMeshSelected: " + err);
                        }
                    }
                    else {
                        this._notifySelectedMeshUnselected(gazer._currentMeshSelected);
                        gazer._currentMeshSelected = null;
                        this.changeGazeColor(new LIB.Color3(0.7, 0.7, 0.7));
                        this.changeLaserColor(new LIB.Color3(0.7, 0.7, 0.7));
                    }
                }
            }
            else {
                gazer._currentHit = null;
                this._notifySelectedMeshUnselected(gazer._currentMeshSelected);
                gazer._currentMeshSelected = null;
                //this._teleportationAllowed = false;
                this.changeGazeColor(new LIB.Color3(0.7, 0.7, 0.7));
                this.changeLaserColor(new LIB.Color3(0.7, 0.7, 0.7));
            }
        };
        VRExperienceHelper.prototype._notifySelectedMeshUnselected = function (mesh) {
            if (mesh) {
                this.onSelectedMeshUnselected.notifyObservers(mesh);
            }
        };
        /**
         * Sets the color of the laser ray from the vr controllers.
         * @param color new color for the ray.
         */
        VRExperienceHelper.prototype.changeLaserColor = function (color) {
            if (this.leftController) {
                this.leftController._setLaserPointerColor(color);
            }
            if (this.rightController) {
                this.rightController._setLaserPointerColor(color);
            }
        };
        /**
         * Sets the color of the ray from the vr headsets gaze.
         * @param color new color for the ray.
         */
        VRExperienceHelper.prototype.changeGazeColor = function (color) {
            if (!this._cameraGazer._gazeTracker.material) {
                return;
            }
            this._cameraGazer._gazeTracker.material.emissiveColor = color;
            if (this.leftController) {
                this.leftController._gazeTracker.material.emissiveColor = color;
            }
            if (this.rightController) {
                this.rightController._gazeTracker.material.emissiveColor = color;
            }
        };
        /**
         * Exits VR and disposes of the vr experience helper
         */
        VRExperienceHelper.prototype.dispose = function () {
            if (this.isInVRMode) {
                this.exitVR();
            }
            if (this._postProcessMove) {
                this._postProcessMove.dispose();
            }
            if (this._webVRCamera) {
                this._webVRCamera.dispose();
            }
            if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.dispose();
            }
            if (!this._useCustomVRButton && this._btnVR.parentNode) {
                document.body.removeChild(this._btnVR);
            }
            if (this._deviceOrientationCamera && (this._scene.activeCamera != this._deviceOrientationCamera)) {
                this._deviceOrientationCamera.dispose();
            }
            if (this._cameraGazer) {
                this._cameraGazer.dispose();
            }
            if (this.leftController) {
                this.leftController.dispose();
            }
            if (this.rightController) {
                this.rightController.dispose();
            }
            if (this._teleportationTarget) {
                this._teleportationTarget.dispose();
            }
            this._floorMeshesCollection = [];
            document.removeEventListener("keydown", this._onKeyDown);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            window.removeEventListener("resize", this._onResize);
            document.removeEventListener("fullscreenchange", this._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
            this._scene.getEngine().onVRDisplayChangedObservable.removeCallback(this._onVRDisplayChanged);
            this._scene.getEngine().onVRRequestPresentStart.removeCallback(this._onVRRequestPresentStart);
            this._scene.getEngine().onVRRequestPresentComplete.removeCallback(this._onVRRequestPresentComplete);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            this._scene.gamepadManager.onGamepadConnectedObservable.removeCallback(this._onNewGamepadConnected);
            this._scene.gamepadManager.onGamepadDisconnectedObservable.removeCallback(this._onNewGamepadDisconnected);
            this._scene.unregisterBeforeRender(this.beforeRender);
        };
        /**
         * Gets the name of the VRExperienceHelper class
         * @returns "VRExperienceHelper"
         */
        VRExperienceHelper.prototype.getClassName = function () {
            return "VRExperienceHelper";
        };
        return VRExperienceHelper;
    }());
    LIB.VRExperienceHelper = VRExperienceHelper;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.vrExperienceHelper.js.map
//# sourceMappingURL=LIB.vrExperienceHelper.js.map
