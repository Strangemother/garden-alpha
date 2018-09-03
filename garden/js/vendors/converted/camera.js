






var LIB;
(function (LIB) {
    var Camera = /** @class */ (function (_super) {
        __extends(Camera, _super);
        function Camera(name, position, scene, setActiveOnSceneIfNoneActive) {
            if (setActiveOnSceneIfNoneActive === void 0) { setActiveOnSceneIfNoneActive = true; }
            var _this = _super.call(this, name, scene) || this;
            /**
             * The vector the camera should consider as up.
             * (default is Vector3(0, 1, 0) aka Vector3.Up())
             */
            _this.upVector = LIB.Vector3.Up();
            _this.orthoLeft = null;
            _this.orthoRight = null;
            _this.orthoBottom = null;
            _this.orthoTop = null;
            /**
             * FOV is set in Radians. (default is 0.8)
             */
            _this.fov = 0.8;
            _this.minZ = 1;
            _this.maxZ = 10000.0;
            _this.inertia = 0.9;
            _this.mode = Camera.PERSPECTIVE_CAMERA;
            _this.isIntermediate = false;
            _this.viewport = new LIB.Viewport(0, 0, 1.0, 1.0);
            /**
             * Restricts the camera to viewing objects with the same layerMask.
             * A camera with a layerMask of 1 will render mesh.layerMask & camera.layerMask!== 0
             */
            _this.layerMask = 0x0FFFFFFF;
            /**
             * fovMode sets the camera frustum bounds to the viewport bounds. (default is FOVMODE_VERTICAL_FIXED)
             */
            _this.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
            // Camera rig members
            _this.cameraRigMode = Camera.RIG_MODE_NONE;
            _this._rigCameras = new Array();
            _this._webvrViewMatrix = LIB.Matrix.Identity();
            _this._skipRendering = false;
            _this.customRenderTargets = new Array();
            // Observables
            _this.onViewMatrixChangedObservable = new LIB.Observable();
            _this.onProjectionMatrixChangedObservable = new LIB.Observable();
            _this.onAfterCheckInputsObservable = new LIB.Observable();
            _this.onRestoreStateObservable = new LIB.Observable();
            // Cache
            _this._computedViewMatrix = LIB.Matrix.Identity();
            _this._projectionMatrix = new LIB.Matrix();
            _this._doNotComputeProjectionMatrix = false;
            _this._worldMatrix = LIB.Matrix.Identity();
            _this._postProcesses = new Array();
            _this._transformMatrix = LIB.Matrix.Zero();
            _this._activeMeshes = new LIB.SmartArray(256);
            _this._globalPosition = LIB.Vector3.Zero();
            _this._refreshFrustumPlanes = true;
            _this.getScene().addCamera(_this);
            if (setActiveOnSceneIfNoneActive && !_this.getScene().activeCamera) {
                _this.getScene().activeCamera = _this;
            }
            _this.position = position;
            return _this;
        }
        Object.defineProperty(Camera, "PERSPECTIVE_CAMERA", {
            get: function () {
                return Camera._PERSPECTIVE_CAMERA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "ORTHOGRAPHIC_CAMERA", {
            get: function () {
                return Camera._ORTHOGRAPHIC_CAMERA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "FOVMODE_VERTICAL_FIXED", {
            /**
             * This is the default FOV mode for perspective cameras.
             * This setting aligns the upper and lower bounds of the viewport to the upper and lower bounds of the camera frustum.
             *
             */
            get: function () {
                return Camera._FOVMODE_VERTICAL_FIXED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "FOVMODE_HORIZONTAL_FIXED", {
            /**
             * This setting aligns the left and right bounds of the viewport to the left and right bounds of the camera frustum.
             *
             */
            get: function () {
                return Camera._FOVMODE_HORIZONTAL_FIXED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_NONE", {
            get: function () {
                return Camera._RIG_MODE_NONE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_STEREOSCOPIC_ANAGLYPH", {
            get: function () {
                return Camera._RIG_MODE_STEREOSCOPIC_ANAGLYPH;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL", {
            get: function () {
                return Camera._RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED", {
            get: function () {
                return Camera._RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_STEREOSCOPIC_OVERUNDER", {
            get: function () {
                return Camera._RIG_MODE_STEREOSCOPIC_OVERUNDER;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_VR", {
            get: function () {
                return Camera._RIG_MODE_VR;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "RIG_MODE_WEBVR", {
            get: function () {
                return Camera._RIG_MODE_WEBVR;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Store current camera state (fov, position, etc..)
         */
        Camera.prototype.storeState = function () {
            this._stateStored = true;
            this._storedFov = this.fov;
            return this;
        };
        /**
         * Restores the camera state values if it has been stored. You must call storeState() first
         */
        Camera.prototype._restoreStateValues = function () {
            if (!this._stateStored) {
                return false;
            }
            this.fov = this._storedFov;
            return true;
        };
        /**
         * Restored camera state. You must call storeState() first
         */
        Camera.prototype.restoreState = function () {
            if (this._restoreStateValues()) {
                this.onRestoreStateObservable.notifyObservers(this);
                return true;
            }
            return false;
        };
        Camera.prototype.getClassName = function () {
            return "Camera";
        };
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        Camera.prototype.toString = function (fullDetails) {
            var ret = "Name: " + this.name;
            ret += ", type: " + this.getClassName();
            if (this.animations) {
                for (var i = 0; i < this.animations.length; i++) {
                    ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails) {
            }
            return ret;
        };
        Object.defineProperty(Camera.prototype, "globalPosition", {
            get: function () {
                return this._globalPosition;
            },
            enumerable: true,
            configurable: true
        });
        Camera.prototype.getActiveMeshes = function () {
            return this._activeMeshes;
        };
        Camera.prototype.isActiveMesh = function (mesh) {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        };
        /**
         * Is this camera ready to be used/rendered
         * @param completeCheck defines if a complete check (including post processes) has to be done (false by default)
         * @return true if the camera is ready
         */
        Camera.prototype.isReady = function (completeCheck) {
            if (completeCheck === void 0) { completeCheck = false; }
            if (completeCheck) {
                for (var _i = 0, _a = this._postProcesses; _i < _a.length; _i++) {
                    var pp = _a[_i];
                    if (pp && !pp.isReady()) {
                        return false;
                    }
                }
            }
            return _super.prototype.isReady.call(this, completeCheck);
        };
        //Cache
        Camera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.position = new LIB.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.upVector = new LIB.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.mode = undefined;
            this._cache.minZ = undefined;
            this._cache.maxZ = undefined;
            this._cache.fov = undefined;
            this._cache.fovMode = undefined;
            this._cache.aspectRatio = undefined;
            this._cache.orthoLeft = undefined;
            this._cache.orthoRight = undefined;
            this._cache.orthoBottom = undefined;
            this._cache.orthoTop = undefined;
            this._cache.renderWidth = undefined;
            this._cache.renderHeight = undefined;
        };
        Camera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            this._cache.position.copyFrom(this.position);
            this._cache.upVector.copyFrom(this.upVector);
        };
        // Synchronized
        Camera.prototype._isSynchronized = function () {
            return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
        };
        Camera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronized.call(this))
                return false;
            return this._cache.position.equals(this.position)
                && this._cache.upVector.equals(this.upVector)
                && this.isSynchronizedWithParent();
        };
        Camera.prototype._isSynchronizedProjectionMatrix = function () {
            var check = this._cache.mode === this.mode
                && this._cache.minZ === this.minZ
                && this._cache.maxZ === this.maxZ;
            if (!check) {
                return false;
            }
            var engine = this.getEngine();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                check = this._cache.fov === this.fov
                    && this._cache.fovMode === this.fovMode
                    && this._cache.aspectRatio === engine.getAspectRatio(this);
            }
            else {
                check = this._cache.orthoLeft === this.orthoLeft
                    && this._cache.orthoRight === this.orthoRight
                    && this._cache.orthoBottom === this.orthoBottom
                    && this._cache.orthoTop === this.orthoTop
                    && this._cache.renderWidth === engine.getRenderWidth()
                    && this._cache.renderHeight === engine.getRenderHeight();
            }
            return check;
        };
        // Controls
        Camera.prototype.attachControl = function (element, noPreventDefault) {
        };
        Camera.prototype.detachControl = function (element) {
        };
        Camera.prototype.update = function () {
            this._checkInputs();
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._updateRigCameras();
            }
        };
        Camera.prototype._checkInputs = function () {
            this.onAfterCheckInputsObservable.notifyObservers(this);
        };
        Object.defineProperty(Camera.prototype, "rigCameras", {
            get: function () {
                return this._rigCameras;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "rigPostProcess", {
            get: function () {
                return this._rigPostProcess;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Internal, gets the first post proces.
         * @returns the first post process to be run on this camera.
         */
        Camera.prototype._getFirstPostProcess = function () {
            for (var ppIndex = 0; ppIndex < this._postProcesses.length; ppIndex++) {
                if (this._postProcesses[ppIndex] !== null) {
                    return this._postProcesses[ppIndex];
                }
            }
            return null;
        };
        Camera.prototype._cascadePostProcessesToRigCams = function () {
            // invalidate framebuffer
            var firstPostProcess = this._getFirstPostProcess();
            if (firstPostProcess) {
                firstPostProcess.markTextureDirty();
            }
            // glue the rigPostProcess to the end of the user postprocesses & assign to each sub-camera
            for (var i = 0, len = this._rigCameras.length; i < len; i++) {
                var cam = this._rigCameras[i];
                var rigPostProcess = cam._rigPostProcess;
                // for VR rig, there does not have to be a post process
                if (rigPostProcess) {
                    var isPass = rigPostProcess instanceof LIB.PassPostProcess;
                    if (isPass) {
                        // any rig which has a PassPostProcess for rig[0], cannot be isIntermediate when there are also user postProcesses
                        cam.isIntermediate = this._postProcesses.length === 0;
                    }
                    cam._postProcesses = this._postProcesses.slice(0).concat(rigPostProcess);
                    rigPostProcess.markTextureDirty();
                }
                else {
                    cam._postProcesses = this._postProcesses.slice(0);
                }
            }
        };
        Camera.prototype.attachPostProcess = function (postProcess, insertAt) {
            if (insertAt === void 0) { insertAt = null; }
            if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
                LIB.Tools.Error("You're trying to reuse a post process not defined as reusable.");
                return 0;
            }
            if (insertAt == null || insertAt < 0) {
                this._postProcesses.push(postProcess);
            }
            else if (this._postProcesses[insertAt] === null) {
                this._postProcesses[insertAt] = postProcess;
            }
            else {
                this._postProcesses.splice(insertAt, 0, postProcess);
            }
            this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
            return this._postProcesses.indexOf(postProcess);
        };
        Camera.prototype.detachPostProcess = function (postProcess) {
            var idx = this._postProcesses.indexOf(postProcess);
            if (idx !== -1) {
                this._postProcesses[idx] = null;
            }
            this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
        };
        Camera.prototype.getWorldMatrix = function () {
            if (this._isSynchronizedViewMatrix()) {
                return this._worldMatrix;
            }
            // Getting the the view matrix will also compute the world matrix.
            this.getViewMatrix();
            return this._worldMatrix;
        };
        Camera.prototype._getViewMatrix = function () {
            return LIB.Matrix.Identity();
        };
        Camera.prototype.getViewMatrix = function (force) {
            if (!force && this._isSynchronizedViewMatrix()) {
                return this._computedViewMatrix;
            }
            this.updateCache();
            this._computedViewMatrix = this._getViewMatrix();
            this._currentRenderId = this.getScene().getRenderId();
            this._childRenderId = this._currentRenderId;
            this._refreshFrustumPlanes = true;
            if (this._cameraRigParams && this._cameraRigParams.vrPreViewMatrix) {
                this._computedViewMatrix.multiplyToRef(this._cameraRigParams.vrPreViewMatrix, this._computedViewMatrix);
            }
            this.onViewMatrixChangedObservable.notifyObservers(this);
            this._computedViewMatrix.invertToRef(this._worldMatrix);
            return this._computedViewMatrix;
        };
        Camera.prototype.freezeProjectionMatrix = function (projection) {
            this._doNotComputeProjectionMatrix = true;
            if (projection !== undefined) {
                this._projectionMatrix = projection;
            }
        };
        ;
        Camera.prototype.unfreezeProjectionMatrix = function () {
            this._doNotComputeProjectionMatrix = false;
        };
        ;
        Camera.prototype.getProjectionMatrix = function (force) {
            if (this._doNotComputeProjectionMatrix || (!force && this._isSynchronizedProjectionMatrix())) {
                return this._projectionMatrix;
            }
            // Cache
            this._cache.mode = this.mode;
            this._cache.minZ = this.minZ;
            this._cache.maxZ = this.maxZ;
            // Matrix
            this._refreshFrustumPlanes = true;
            var engine = this.getEngine();
            var scene = this.getScene();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                this._cache.fov = this.fov;
                this._cache.fovMode = this.fovMode;
                this._cache.aspectRatio = engine.getAspectRatio(this);
                if (this.minZ <= 0) {
                    this.minZ = 0.1;
                }
                if (scene.useRightHandedSystem) {
                    LIB.Matrix.PerspectiveFovRHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix, this.fovMode === Camera.FOVMODE_VERTICAL_FIXED);
                }
                else {
                    LIB.Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix, this.fovMode === Camera.FOVMODE_VERTICAL_FIXED);
                }
            }
            else {
                var halfWidth = engine.getRenderWidth() / 2.0;
                var halfHeight = engine.getRenderHeight() / 2.0;
                if (scene.useRightHandedSystem) {
                    LIB.Matrix.OrthoOffCenterRHToRef(this.orthoLeft || -halfWidth, this.orthoRight || halfWidth, this.orthoBottom || -halfHeight, this.orthoTop || halfHeight, this.minZ, this.maxZ, this._projectionMatrix);
                }
                else {
                    LIB.Matrix.OrthoOffCenterLHToRef(this.orthoLeft || -halfWidth, this.orthoRight || halfWidth, this.orthoBottom || -halfHeight, this.orthoTop || halfHeight, this.minZ, this.maxZ, this._projectionMatrix);
                }
                this._cache.orthoLeft = this.orthoLeft;
                this._cache.orthoRight = this.orthoRight;
                this._cache.orthoBottom = this.orthoBottom;
                this._cache.orthoTop = this.orthoTop;
                this._cache.renderWidth = engine.getRenderWidth();
                this._cache.renderHeight = engine.getRenderHeight();
            }
            this.onProjectionMatrixChangedObservable.notifyObservers(this);
            return this._projectionMatrix;
        };
        Camera.prototype.getTranformationMatrix = function () {
            this._computedViewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
            return this._transformMatrix;
        };
        Camera.prototype.updateFrustumPlanes = function () {
            if (!this._refreshFrustumPlanes) {
                return;
            }
            this.getTranformationMatrix();
            if (!this._frustumPlanes) {
                this._frustumPlanes = LIB.Frustum.GetPlanes(this._transformMatrix);
            }
            else {
                LIB.Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }
            this._refreshFrustumPlanes = false;
        };
        Camera.prototype.isInFrustum = function (target) {
            this.updateFrustumPlanes();
            return target.isInFrustum(this._frustumPlanes);
        };
        Camera.prototype.isCompletelyInFrustum = function (target) {
            this.updateFrustumPlanes();
            return target.isCompletelyInFrustum(this._frustumPlanes);
        };
        Camera.prototype.getForwardRay = function (length, transform, origin) {
            if (length === void 0) { length = 100; }
            if (!transform) {
                transform = this.getWorldMatrix();
            }
            if (!origin) {
                origin = this.position;
            }
            var forward = new LIB.Vector3(0, 0, 1);
            var forwardWorld = LIB.Vector3.TransformNormal(forward, transform);
            var direction = LIB.Vector3.Normalize(forwardWorld);
            return new LIB.Ray(origin, direction, length);
        };
        /**
         * Releases resources associated with this node.
         * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
         * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
         */
        Camera.prototype.dispose = function (doNotRecurse, disposeMaterialAndTextures) {
            if (disposeMaterialAndTextures === void 0) { disposeMaterialAndTextures = false; }
            // Observables
            this.onViewMatrixChangedObservable.clear();
            this.onProjectionMatrixChangedObservable.clear();
            this.onAfterCheckInputsObservable.clear();
            this.onRestoreStateObservable.clear();
            // Inputs
            if (this.inputs) {
                this.inputs.clear();
            }
            // Animations
            this.getScene().stopAnimation(this);
            // Remove from scene
            this.getScene().removeCamera(this);
            while (this._rigCameras.length > 0) {
                var camera = this._rigCameras.pop();
                if (camera) {
                    camera.dispose();
                }
            }
            // Postprocesses
            if (this._rigPostProcess) {
                this._rigPostProcess.dispose(this);
                this._rigPostProcess = null;
                this._postProcesses = [];
            }
            else if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._rigPostProcess = null;
                this._postProcesses = [];
            }
            else {
                var i = this._postProcesses.length;
                while (--i >= 0) {
                    var postProcess = this._postProcesses[i];
                    if (postProcess) {
                        postProcess.dispose(this);
                    }
                }
            }
            // Render targets
            var i = this.customRenderTargets.length;
            while (--i >= 0) {
                this.customRenderTargets[i].dispose();
            }
            this.customRenderTargets = [];
            // Active Meshes
            this._activeMeshes.dispose();
            _super.prototype.dispose.call(this, doNotRecurse, disposeMaterialAndTextures);
        };
        Object.defineProperty(Camera.prototype, "leftCamera", {
            // ---- Camera rigs section ----
            get: function () {
                if (this._rigCameras.length < 1) {
                    return null;
                }
                return this._rigCameras[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "rightCamera", {
            get: function () {
                if (this._rigCameras.length < 2) {
                    return null;
                }
                return this._rigCameras[1];
            },
            enumerable: true,
            configurable: true
        });
        Camera.prototype.getLeftTarget = function () {
            if (this._rigCameras.length < 1) {
                return null;
            }
            return this._rigCameras[0].getTarget();
        };
        Camera.prototype.getRightTarget = function () {
            if (this._rigCameras.length < 2) {
                return null;
            }
            return this._rigCameras[1].getTarget();
        };
        Camera.prototype.setCameraRigMode = function (mode, rigParams) {
            if (this.cameraRigMode === mode) {
                return;
            }
            while (this._rigCameras.length > 0) {
                var camera = this._rigCameras.pop();
                if (camera) {
                    camera.dispose();
                }
            }
            this.cameraRigMode = mode;
            this._cameraRigParams = {};
            //we have to implement stereo camera calcultating left and right viewpoints from interaxialDistance and target,
            //not from a given angle as it is now, but until that complete code rewriting provisional stereoHalfAngle value is introduced
            this._cameraRigParams.interaxialDistance = rigParams.interaxialDistance || 0.0637;
            this._cameraRigParams.stereoHalfAngle = LIB.Tools.ToRadians(this._cameraRigParams.interaxialDistance / 0.0637);
            // create the rig cameras, unless none
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                var leftCamera = this.createRigCamera(this.name + "_L", 0);
                var rightCamera = this.createRigCamera(this.name + "_R", 1);
                if (leftCamera && rightCamera) {
                    this._rigCameras.push(leftCamera);
                    this._rigCameras.push(rightCamera);
                }
            }
            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                    this._rigCameras[0]._rigPostProcess = new LIB.PassPostProcess(this.name + "_passthru", 1.0, this._rigCameras[0]);
                    this._rigCameras[1]._rigPostProcess = new LIB.AnaglyphPostProcess(this.name + "_anaglyph", 1.0, this._rigCameras);
                    break;
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                    var isStereoscopicHoriz = this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
                    this._rigCameras[0]._rigPostProcess = new LIB.PassPostProcess(this.name + "_passthru", 1.0, this._rigCameras[0]);
                    this._rigCameras[1]._rigPostProcess = new LIB.StereoscopicInterlacePostProcess(this.name + "_stereoInterlace", this._rigCameras, isStereoscopicHoriz);
                    break;
                case Camera.RIG_MODE_VR:
                    var metrics = rigParams.vrCameraMetrics || LIB.VRCameraMetrics.GetDefault();
                    this._rigCameras[0]._cameraRigParams.vrMetrics = metrics;
                    this._rigCameras[0].viewport = new LIB.Viewport(0, 0, 0.5, 1.0);
                    this._rigCameras[0]._cameraRigParams.vrWorkMatrix = new LIB.Matrix();
                    this._rigCameras[0]._cameraRigParams.vrHMatrix = metrics.leftHMatrix;
                    this._rigCameras[0]._cameraRigParams.vrPreViewMatrix = metrics.leftPreViewMatrix;
                    this._rigCameras[0].getProjectionMatrix = this._rigCameras[0]._getVRProjectionMatrix;
                    this._rigCameras[1]._cameraRigParams.vrMetrics = metrics;
                    this._rigCameras[1].viewport = new LIB.Viewport(0.5, 0, 0.5, 1.0);
                    this._rigCameras[1]._cameraRigParams.vrWorkMatrix = new LIB.Matrix();
                    this._rigCameras[1]._cameraRigParams.vrHMatrix = metrics.rightHMatrix;
                    this._rigCameras[1]._cameraRigParams.vrPreViewMatrix = metrics.rightPreViewMatrix;
                    this._rigCameras[1].getProjectionMatrix = this._rigCameras[1]._getVRProjectionMatrix;
                    if (metrics.compensateDistortion) {
                        this._rigCameras[0]._rigPostProcess = new LIB.VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Left", this._rigCameras[0], false, metrics);
                        this._rigCameras[1]._rigPostProcess = new LIB.VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Right", this._rigCameras[1], true, metrics);
                    }
                    break;
                case Camera.RIG_MODE_WEBVR:
                    if (rigParams.vrDisplay) {
                        var leftEye = rigParams.vrDisplay.getEyeParameters('left');
                        var rightEye = rigParams.vrDisplay.getEyeParameters('right');
                        //Left eye
                        this._rigCameras[0].viewport = new LIB.Viewport(0, 0, 0.5, 1.0);
                        this._rigCameras[0].setCameraRigParameter("left", true);
                        //leaving this for future reference
                        this._rigCameras[0].setCameraRigParameter("specs", rigParams.specs);
                        this._rigCameras[0].setCameraRigParameter("eyeParameters", leftEye);
                        this._rigCameras[0].setCameraRigParameter("frameData", rigParams.frameData);
                        this._rigCameras[0].setCameraRigParameter("parentCamera", rigParams.parentCamera);
                        this._rigCameras[0]._cameraRigParams.vrWorkMatrix = new LIB.Matrix();
                        this._rigCameras[0].getProjectionMatrix = this._getWebVRProjectionMatrix;
                        this._rigCameras[0].parent = this;
                        this._rigCameras[0]._getViewMatrix = this._getWebVRViewMatrix;
                        //Right eye
                        this._rigCameras[1].viewport = new LIB.Viewport(0.5, 0, 0.5, 1.0);
                        this._rigCameras[1].setCameraRigParameter('eyeParameters', rightEye);
                        this._rigCameras[1].setCameraRigParameter("specs", rigParams.specs);
                        this._rigCameras[1].setCameraRigParameter("frameData", rigParams.frameData);
                        this._rigCameras[1].setCameraRigParameter("parentCamera", rigParams.parentCamera);
                        this._rigCameras[1]._cameraRigParams.vrWorkMatrix = new LIB.Matrix();
                        this._rigCameras[1].getProjectionMatrix = this._getWebVRProjectionMatrix;
                        this._rigCameras[1].parent = this;
                        this._rigCameras[1]._getViewMatrix = this._getWebVRViewMatrix;
                        if (Camera.UseAlternateWebVRRendering) {
                            this._rigCameras[1]._skipRendering = true;
                            this._rigCameras[0]._alternateCamera = this._rigCameras[1];
                        }
                    }
                    break;
            }
            this._cascadePostProcessesToRigCams();
            this.update();
        };
        Camera.prototype._getVRProjectionMatrix = function () {
            LIB.Matrix.PerspectiveFovLHToRef(this._cameraRigParams.vrMetrics.aspectRatioFov, this._cameraRigParams.vrMetrics.aspectRatio, this.minZ, this.maxZ, this._cameraRigParams.vrWorkMatrix);
            this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrHMatrix, this._projectionMatrix);
            return this._projectionMatrix;
        };
        Camera.prototype._updateCameraRotationMatrix = function () {
            //Here for WebVR
        };
        Camera.prototype._updateWebVRCameraRotationMatrix = function () {
            //Here for WebVR
        };
        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        Camera.prototype._getWebVRProjectionMatrix = function () {
            return LIB.Matrix.Identity();
        };
        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        Camera.prototype._getWebVRViewMatrix = function () {
            return LIB.Matrix.Identity();
        };
        Camera.prototype.setCameraRigParameter = function (name, value) {
            if (!this._cameraRigParams) {
                this._cameraRigParams = {};
            }
            this._cameraRigParams[name] = value;
            //provisionnally:
            if (name === "interaxialDistance") {
                this._cameraRigParams.stereoHalfAngle = LIB.Tools.ToRadians(value / 0.0637);
            }
        };
        /**
         * needs to be overridden by children so sub has required properties to be copied
         */
        Camera.prototype.createRigCamera = function (name, cameraIndex) {
            return null;
        };
        /**
         * May need to be overridden by children
         */
        Camera.prototype._updateRigCameras = function () {
            for (var i = 0; i < this._rigCameras.length; i++) {
                this._rigCameras[i].minZ = this.minZ;
                this._rigCameras[i].maxZ = this.maxZ;
                this._rigCameras[i].fov = this.fov;
            }
            // only update viewport when ANAGLYPH
            if (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH) {
                this._rigCameras[0].viewport = this._rigCameras[1].viewport = this.viewport;
            }
        };
        Camera.prototype._setupInputs = function () {
        };
        Camera.prototype.serialize = function () {
            var serializationObject = LIB.SerializationHelper.Serialize(this);
            // Type
            serializationObject.type = this.getClassName();
            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }
            if (this.inputs) {
                this.inputs.serialize(serializationObject);
            }
            // Animations
            LIB.Animation.AppendSerializedAnimations(this, serializationObject);
            serializationObject.ranges = this.serializeAnimationRanges();
            return serializationObject;
        };
        Camera.prototype.clone = function (name) {
            return LIB.SerializationHelper.Clone(Camera.GetConstructorFromName(this.getClassName(), name, this.getScene(), this.interaxialDistance, this.isStereoscopicSideBySide), this);
        };
        Camera.prototype.getDirection = function (localAxis) {
            var result = LIB.Vector3.Zero();
            this.getDirectionToRef(localAxis, result);
            return result;
        };
        Camera.prototype.getDirectionToRef = function (localAxis, result) {
            LIB.Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
        };
        Camera.GetConstructorFromName = function (type, name, scene, interaxial_distance, isStereoscopicSideBySide) {
            if (interaxial_distance === void 0) { interaxial_distance = 0; }
            if (isStereoscopicSideBySide === void 0) { isStereoscopicSideBySide = true; }
            switch (type) {
                case "ArcRotateCamera":
                    return function () { return new LIB.ArcRotateCamera(name, 0, 0, 1.0, LIB.Vector3.Zero(), scene); };
                case "DeviceOrientationCamera":
                    return function () { return new LIB.DeviceOrientationCamera(name, LIB.Vector3.Zero(), scene); };
                case "FollowCamera":
                    return function () { return new LIB.FollowCamera(name, LIB.Vector3.Zero(), scene); };
                case "ArcFollowCamera":
                    return function () { return new LIB.ArcFollowCamera(name, 0, 0, 1.0, null, scene); };
                case "GamepadCamera":
                    return function () { return new LIB.GamepadCamera(name, LIB.Vector3.Zero(), scene); };
                case "TouchCamera":
                    return function () { return new LIB.TouchCamera(name, LIB.Vector3.Zero(), scene); };
                case "VirtualJoysticksCamera":
                    return function () { return new LIB.VirtualJoysticksCamera(name, LIB.Vector3.Zero(), scene); };
                case "WebVRFreeCamera":
                    return function () { return new LIB.WebVRFreeCamera(name, LIB.Vector3.Zero(), scene); };
                case "WebVRGamepadCamera":
                    return function () { return new LIB.WebVRFreeCamera(name, LIB.Vector3.Zero(), scene); };
                case "VRDeviceOrientationFreeCamera":
                    return function () { return new LIB.VRDeviceOrientationFreeCamera(name, LIB.Vector3.Zero(), scene); };
                case "VRDeviceOrientationGamepadCamera":
                    return function () { return new LIB.VRDeviceOrientationGamepadCamera(name, LIB.Vector3.Zero(), scene); };
                case "AnaglyphArcRotateCamera":
                    return function () { return new LIB.AnaglyphArcRotateCamera(name, 0, 0, 1.0, LIB.Vector3.Zero(), interaxial_distance, scene); };
                case "AnaglyphFreeCamera":
                    return function () { return new LIB.AnaglyphFreeCamera(name, LIB.Vector3.Zero(), interaxial_distance, scene); };
                case "AnaglyphGamepadCamera":
                    return function () { return new LIB.AnaglyphGamepadCamera(name, LIB.Vector3.Zero(), interaxial_distance, scene); };
                case "AnaglyphUniversalCamera":
                    return function () { return new LIB.AnaglyphUniversalCamera(name, LIB.Vector3.Zero(), interaxial_distance, scene); };
                case "StereoscopicArcRotateCamera":
                    return function () { return new LIB.StereoscopicArcRotateCamera(name, 0, 0, 1.0, LIB.Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene); };
                case "StereoscopicFreeCamera":
                    return function () { return new LIB.StereoscopicFreeCamera(name, LIB.Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene); };
                case "StereoscopicGamepadCamera":
                    return function () { return new LIB.StereoscopicGamepadCamera(name, LIB.Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene); };
                case "StereoscopicUniversalCamera":
                    return function () { return new LIB.StereoscopicUniversalCamera(name, LIB.Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene); };
                case "FreeCamera": // Forcing Universal here
                    return function () { return new LIB.UniversalCamera(name, LIB.Vector3.Zero(), scene); };
                default: // Universal Camera is the default value
                    return function () { return new LIB.UniversalCamera(name, LIB.Vector3.Zero(), scene); };
            }
        };
        Camera.prototype.computeWorldMatrix = function () {
            return this.getWorldMatrix();
        };
        Camera.Parse = function (parsedCamera, scene) {
            var type = parsedCamera.type;
            var construct = Camera.GetConstructorFromName(type, parsedCamera.name, scene, parsedCamera.interaxial_distance, parsedCamera.isStereoscopicSideBySide);
            var camera = LIB.SerializationHelper.Parse(construct, parsedCamera, scene);
            // Parent
            if (parsedCamera.parentId) {
                camera._waitingParentId = parsedCamera.parentId;
            }
            //If camera has an input manager, let it parse inputs settings
            if (camera.inputs) {
                camera.inputs.parse(parsedCamera);
                camera._setupInputs();
            }
            if (camera.setPosition) { // need to force position
                camera.position.copyFromFloats(0, 0, 0);
                camera.setPosition(LIB.Vector3.FromArray(parsedCamera.position));
            }
            // Target
            if (parsedCamera.target) {
                if (camera.setTarget) {
                    camera.setTarget(LIB.Vector3.FromArray(parsedCamera.target));
                }
            }
            // Apply 3d rig, when found
            if (parsedCamera.cameraRigMode) {
                var rigParams = (parsedCamera.interaxial_distance) ? { interaxialDistance: parsedCamera.interaxial_distance } : {};
                camera.setCameraRigMode(parsedCamera.cameraRigMode, rigParams);
            }
            // Animations
            if (parsedCamera.animations) {
                for (var animationIndex = 0; animationIndex < parsedCamera.animations.length; animationIndex++) {
                    var parsedAnimation = parsedCamera.animations[animationIndex];
                    camera.animations.push(LIB.Animation.Parse(parsedAnimation));
                }
                LIB.Node.ParseAnimationRanges(camera, parsedCamera, scene);
            }
            if (parsedCamera.autoAnimate) {
                scene.beginAnimation(camera, parsedCamera.autoAnimateFrom, parsedCamera.autoAnimateTo, parsedCamera.autoAnimateLoop, parsedCamera.autoAnimateSpeed || 1.0);
            }
            return camera;
        };
        // Statics
        Camera._PERSPECTIVE_CAMERA = 0;
        Camera._ORTHOGRAPHIC_CAMERA = 1;
        Camera._FOVMODE_VERTICAL_FIXED = 0;
        Camera._FOVMODE_HORIZONTAL_FIXED = 1;
        Camera._RIG_MODE_NONE = 0;
        Camera._RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
        Camera._RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
        Camera._RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
        Camera._RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
        Camera._RIG_MODE_VR = 20;
        Camera._RIG_MODE_WEBVR = 21;
        Camera.ForceAttachControlToAlwaysPreventDefault = false;
        Camera.UseAlternateWebVRRendering = false;
        __decorate([
            LIB.serializeAsVector3()
        ], Camera.prototype, "position", void 0);
        __decorate([
            LIB.serializeAsVector3()
        ], Camera.prototype, "upVector", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "orthoLeft", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "orthoRight", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "orthoBottom", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "orthoTop", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "fov", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "minZ", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "maxZ", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "inertia", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "mode", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "layerMask", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "fovMode", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "cameraRigMode", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "interaxialDistance", void 0);
        __decorate([
            LIB.serialize()
        ], Camera.prototype, "isStereoscopicSideBySide", void 0);
        return Camera;
    }(LIB.Node));
    LIB.Camera = Camera;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.camera.js.map
//# sourceMappingURL=LIB.camera.js.map