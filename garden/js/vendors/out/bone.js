

var LIB;
(function (LIB) {
    /**
     * Class used to store bone information
     * @see http://doc.LIBjs.com/how_to/how_to_use_bones_and_skeletons
     */
    var Bone = /** @class */ (function (_super) {
        __extends(Bone, _super);
        /**
         * Create a new bone
         * @param name defines the bone name
         * @param skeleton defines the parent skeleton
         * @param parentBone defines the parent (can be null if the bone is the root)
         * @param localMatrix defines the local matrix
         * @param restPose defines the rest pose matrix
         * @param baseMatrix defines the base matrix
         * @param index defines index of the bone in the hiearchy
         */
        function Bone(
        /**
         * defines the bone name
         */
        name, skeleton, parentBone, localMatrix, restPose, baseMatrix, index) {
            if (parentBone === void 0) { parentBone = null; }
            if (localMatrix === void 0) { localMatrix = null; }
            if (restPose === void 0) { restPose = null; }
            if (baseMatrix === void 0) { baseMatrix = null; }
            if (index === void 0) { index = null; }
            var _this = _super.call(this, name, skeleton.getScene()) || this;
            _this.name = name;
            /**
             * Gets the list of child bones
             */
            _this.children = new Array();
            /** Gets the animations associated with this bone */
            _this.animations = new Array();
            /**
             * @hidden Internal only
             * Set this value to map this bone to a different index in the transform matrices
             * Set this value to -1 to exclude the bone from the transform matrices
             */
            _this._index = null;
            _this._absoluteTransform = new LIB.Matrix();
            _this._invertedAbsoluteTransform = new LIB.Matrix();
            _this._scalingDeterminant = 1;
            _this._worldTransform = new LIB.Matrix();
            _this._needToDecompose = true;
            _this._needToCompose = false;
            _this._skeleton = skeleton;
            _this._localMatrix = localMatrix ? localMatrix.clone() : LIB.Matrix.Identity();
            _this._restPose = restPose ? restPose : _this._localMatrix.clone();
            _this._baseMatrix = baseMatrix ? baseMatrix : _this._localMatrix.clone();
            _this._index = index;
            skeleton.bones.push(_this);
            _this.setParent(parentBone, false);
            if (baseMatrix || localMatrix) {
                _this._updateDifferenceMatrix();
            }
            return _this;
        }
        Object.defineProperty(Bone.prototype, "_matrix", {
            /** @hidden */
            get: function () {
                this._compose();
                return this._localMatrix;
            },
            /** @hidden */
            set: function (value) {
                this._localMatrix.copyFrom(value);
                this._needToDecompose = true;
            },
            enumerable: true,
            configurable: true
        });
        // Members
        /**
         * Gets the parent skeleton
         * @returns a skeleton
         */
        Bone.prototype.getSkeleton = function () {
            return this._skeleton;
        };
        /**
         * Gets parent bone
         * @returns a bone or null if the bone is the root of the bone hierarchy
         */
        Bone.prototype.getParent = function () {
            return this._parent;
        };
        /**
         * Sets the parent bone
         * @param parent defines the parent (can be null if the bone is the root)
         * @param updateDifferenceMatrix defines if the difference matrix must be updated
         */
        Bone.prototype.setParent = function (parent, updateDifferenceMatrix) {
            if (updateDifferenceMatrix === void 0) { updateDifferenceMatrix = true; }
            if (this._parent === parent) {
                return;
            }
            if (this._parent) {
                var index = this._parent.children.indexOf(this);
                if (index !== -1) {
                    this._parent.children.splice(index, 1);
                }
            }
            this._parent = parent;
            if (this._parent) {
                this._parent.children.push(this);
            }
            if (updateDifferenceMatrix) {
                this._updateDifferenceMatrix();
            }
            this.markAsDirty();
        };
        /**
         * Gets the local matrix
         * @returns a matrix
         */
        Bone.prototype.getLocalMatrix = function () {
            this._compose();
            return this._localMatrix;
        };
        /**
         * Gets the base matrix (initial matrix which remains unchanged)
         * @returns a matrix
         */
        Bone.prototype.getBaseMatrix = function () {
            return this._baseMatrix;
        };
        /**
         * Gets the rest pose matrix
         * @returns a matrix
         */
        Bone.prototype.getRestPose = function () {
            return this._restPose;
        };
        /**
         * Gets a matrix used to store world matrix (ie. the matrix sent to shaders)
         */
        Bone.prototype.getWorldMatrix = function () {
            return this._worldTransform;
        };
        /**
         * Sets the local matrix to rest pose matrix
         */
        Bone.prototype.returnToRest = function () {
            this.updateMatrix(this._restPose.clone());
        };
        /**
         * Gets the inverse of the absolute transform matrix.
         * This matrix will be multiplied by local matrix to get the difference matrix (ie. the difference between original state and current state)
         * @returns a matrix
         */
        Bone.prototype.getInvertedAbsoluteTransform = function () {
            return this._invertedAbsoluteTransform;
        };
        /**
         * Gets the absolute transform matrix (ie base matrix * parent world matrix)
         * @returns a matrix
         */
        Bone.prototype.getAbsoluteTransform = function () {
            return this._absoluteTransform;
        };
        Object.defineProperty(Bone.prototype, "position", {
            // Properties (matches AbstractMesh properties)
            /** Gets or sets current position (in local space) */
            get: function () {
                this._decompose();
                return this._localPosition;
            },
            set: function (newPosition) {
                this._decompose();
                this._localPosition.copyFrom(newPosition);
                this._markAsDirtyAndCompose();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "rotation", {
            /** Gets or sets current rotation (in local space) */
            get: function () {
                return this.getRotation();
            },
            set: function (newRotation) {
                this.setRotation(newRotation);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "rotationQuaternion", {
            /** Gets or sets current rotation quaternion (in local space) */
            get: function () {
                this._decompose();
                return this._localRotation;
            },
            set: function (newRotation) {
                this.setRotationQuaternion(newRotation);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "scaling", {
            /** Gets or sets current scaling (in local space) */
            get: function () {
                return this.getScale();
            },
            set: function (newScaling) {
                this.setScale(newScaling);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "animationPropertiesOverride", {
            /**
             * Gets the animation properties override
             */
            get: function () {
                return this._skeleton.animationPropertiesOverride;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        Bone.prototype._decompose = function () {
            if (!this._needToDecompose) {
                return;
            }
            this._needToDecompose = false;
            if (!this._localScaling) {
                this._localScaling = LIB.Vector3.Zero();
                this._localRotation = LIB.Quaternion.Zero();
                this._localPosition = LIB.Vector3.Zero();
            }
            this._localMatrix.decompose(this._localScaling, this._localRotation, this._localPosition);
        };
        Bone.prototype._compose = function () {
            if (!this._needToCompose) {
                return;
            }
            this._needToCompose = false;
            LIB.Matrix.ComposeToRef(this._localScaling, this._localRotation, this._localPosition, this._localMatrix);
        };
        /**
         * Update the base and local matrices
         * @param matrix defines the new base or local matrix
         * @param updateDifferenceMatrix defines if the difference matrix must be updated
         * @param updateLocalMatrix defines if the local matrix should be updated
         */
        Bone.prototype.updateMatrix = function (matrix, updateDifferenceMatrix, updateLocalMatrix) {
            if (updateDifferenceMatrix === void 0) { updateDifferenceMatrix = true; }
            if (updateLocalMatrix === void 0) { updateLocalMatrix = true; }
            this._baseMatrix.copyFrom(matrix);
            if (updateDifferenceMatrix) {
                this._updateDifferenceMatrix();
            }
            if (updateLocalMatrix) {
                this._localMatrix.copyFrom(matrix);
                this._markAsDirtyAndDecompose();
            }
            else {
                this.markAsDirty();
            }
        };
        /** @hidden */
        Bone.prototype._updateDifferenceMatrix = function (rootMatrix, updateChildren) {
            if (updateChildren === void 0) { updateChildren = true; }
            if (!rootMatrix) {
                rootMatrix = this._baseMatrix;
            }
            if (this._parent) {
                rootMatrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            }
            else {
                this._absoluteTransform.copyFrom(rootMatrix);
            }
            this._absoluteTransform.invertToRef(this._invertedAbsoluteTransform);
            if (updateChildren) {
                for (var index = 0; index < this.children.length; index++) {
                    this.children[index]._updateDifferenceMatrix();
                }
            }
            this._scalingDeterminant = (this._absoluteTransform.determinant() < 0 ? -1 : 1);
        };
        /**
         * Flag the bone as dirty (Forcing it to update everything)
         */
        Bone.prototype.markAsDirty = function () {
            this._currentRenderId++;
            this._childRenderId++;
            this._skeleton._markAsDirty();
        };
        Bone.prototype._markAsDirtyAndCompose = function () {
            this.markAsDirty();
            this._needToCompose = true;
        };
        Bone.prototype._markAsDirtyAndDecompose = function () {
            this.markAsDirty();
            this._needToDecompose = true;
        };
        /**
         * Copy an animation range from another bone
         * @param source defines the source bone
         * @param rangeName defines the range name to copy
         * @param frameOffset defines the frame offset
         * @param rescaleAsRequired defines if rescaling must be applied if required
         * @param skelDimensionsRatio defines the scaling ratio
         * @returns true if operation was successful
         */
        Bone.prototype.copyAnimationRange = function (source, rangeName, frameOffset, rescaleAsRequired, skelDimensionsRatio) {
            if (rescaleAsRequired === void 0) { rescaleAsRequired = false; }
            if (skelDimensionsRatio === void 0) { skelDimensionsRatio = null; }
            // all animation may be coming from a library skeleton, so may need to create animation
            if (this.animations.length === 0) {
                this.animations.push(new LIB.Animation(this.name, "_matrix", source.animations[0].framePerSecond, LIB.Animation.ANIMATIONTYPE_MATRIX, 0));
                this.animations[0].setKeys([]);
            }
            // get animation info / verify there is such a range from the source bone
            var sourceRange = source.animations[0].getRange(rangeName);
            if (!sourceRange) {
                return false;
            }
            var from = sourceRange.from;
            var to = sourceRange.to;
            var sourceKeys = source.animations[0].getKeys();
            // rescaling prep
            var sourceBoneLength = source.length;
            var sourceParent = source.getParent();
            var parent = this.getParent();
            var parentScalingReqd = rescaleAsRequired && sourceParent && sourceBoneLength && this.length && sourceBoneLength !== this.length;
            var parentRatio = parentScalingReqd && parent && sourceParent ? parent.length / sourceParent.length : 1;
            var dimensionsScalingReqd = rescaleAsRequired && !parent && skelDimensionsRatio && (skelDimensionsRatio.x !== 1 || skelDimensionsRatio.y !== 1 || skelDimensionsRatio.z !== 1);
            var destKeys = this.animations[0].getKeys();
            // loop vars declaration
            var orig;
            var origTranslation;
            var mat;
            for (var key = 0, nKeys = sourceKeys.length; key < nKeys; key++) {
                orig = sourceKeys[key];
                if (orig.frame >= from && orig.frame <= to) {
                    if (rescaleAsRequired) {
                        mat = orig.value.clone();
                        // scale based on parent ratio, when bone has parent
                        if (parentScalingReqd) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.scaleInPlace(parentRatio));
                            // scale based on skeleton dimension ratio when root bone, and value is passed
                        }
                        else if (dimensionsScalingReqd && skelDimensionsRatio) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.multiplyInPlace(skelDimensionsRatio));
                            // use original when root bone, and no data for skelDimensionsRatio
                        }
                        else {
                            mat = orig.value;
                        }
                    }
                    else {
                        mat = orig.value;
                    }
                    destKeys.push({ frame: orig.frame + frameOffset, value: mat });
                }
            }
            this.animations[0].createRange(rangeName, from + frameOffset, to + frameOffset);
            return true;
        };
        /**
         * Translate the bone in local or world space
         * @param vec The amount to translate the bone
         * @param space The space that the translation is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         */
        Bone.prototype.translate = function (vec, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            var lm = this.getLocalMatrix();
            if (space == LIB.Space.LOCAL) {
                lm.m[12] += vec.x;
                lm.m[13] += vec.y;
                lm.m[14] += vec.z;
            }
            else {
                var wm = null;
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh) {
                    wm = mesh.getWorldMatrix();
                }
                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                var tvec = Bone._tmpVecs[0];
                if (this._parent) {
                    if (mesh && wm) {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                        tmat.multiplyToRef(wm, tmat);
                    }
                    else {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                    }
                }
                tmat.m[12] = 0;
                tmat.m[13] = 0;
                tmat.m[14] = 0;
                tmat.invert();
                LIB.Vector3.TransformCoordinatesToRef(vec, tmat, tvec);
                lm.m[12] += tvec.x;
                lm.m[13] += tvec.y;
                lm.m[14] += tvec.z;
            }
            this._markAsDirtyAndDecompose();
        };
        /**
         * Set the postion of the bone in local or world space
         * @param position The position to set the bone
         * @param space The space that the position is in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         */
        Bone.prototype.setPosition = function (position, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            var lm = this.getLocalMatrix();
            if (space == LIB.Space.LOCAL) {
                lm.m[12] = position.x;
                lm.m[13] = position.y;
                lm.m[14] = position.z;
            }
            else {
                var wm = null;
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh) {
                    wm = mesh.getWorldMatrix();
                }
                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                var vec = Bone._tmpVecs[0];
                if (this._parent) {
                    if (mesh && wm) {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                        tmat.multiplyToRef(wm, tmat);
                    }
                    else {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                    }
                }
                tmat.invert();
                LIB.Vector3.TransformCoordinatesToRef(position, tmat, vec);
                lm.m[12] = vec.x;
                lm.m[13] = vec.y;
                lm.m[14] = vec.z;
            }
            this._markAsDirtyAndDecompose();
        };
        /**
         * Set the absolute position of the bone (world space)
         * @param position The position to set the bone
         * @param mesh The mesh that this bone is attached to
         */
        Bone.prototype.setAbsolutePosition = function (position, mesh) {
            this.setPosition(position, LIB.Space.WORLD, mesh);
        };
        /**
         * Scale the bone on the x, y and z axes (in local space)
         * @param x The amount to scale the bone on the x axis
         * @param y The amount to scale the bone on the y axis
         * @param z The amount to scale the bone on the z axis
         * @param scaleChildren sets this to true if children of the bone should be scaled as well (false by default)
         */
        Bone.prototype.scale = function (x, y, z, scaleChildren) {
            if (scaleChildren === void 0) { scaleChildren = false; }
            var locMat = this.getLocalMatrix();
            // Apply new scaling on top of current local matrix
            var scaleMat = Bone._tmpMats[0];
            LIB.Matrix.ScalingToRef(x, y, z, scaleMat);
            scaleMat.multiplyToRef(locMat, locMat);
            // Invert scaling matrix and apply the inverse to all children
            scaleMat.invert();
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var cm = child.getLocalMatrix();
                cm.multiplyToRef(scaleMat, cm);
                cm.m[12] *= x;
                cm.m[13] *= y;
                cm.m[14] *= z;
                child._markAsDirtyAndDecompose();
            }
            this._markAsDirtyAndDecompose();
            if (scaleChildren) {
                for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    child.scale(x, y, z, scaleChildren);
                }
            }
        };
        /**
         * Set the bone scaling in local space
         * @param scale defines the scaling vector
         */
        Bone.prototype.setScale = function (scale) {
            this._decompose();
            this._localScaling.copyFrom(scale);
            this._markAsDirtyAndCompose();
        };
        /**
         * Gets the current scaling in local space
         * @returns the current scaling vector
         */
        Bone.prototype.getScale = function () {
            this._decompose();
            return this._localScaling;
        };
        /**
         * Gets the current scaling in local space and stores it in a target vector
         * @param result defines the target vector
         */
        Bone.prototype.getScaleToRef = function (result) {
            this._decompose();
            result.copyFrom(this._localScaling);
        };
        /**
         * Set the yaw, pitch, and roll of the bone in local or world space
         * @param yaw The rotation of the bone on the y axis
         * @param pitch The rotation of the bone on the x axis
         * @param roll The rotation of the bone on the z axis
         * @param space The space that the axes of rotation are in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         */
        Bone.prototype.setYawPitchRoll = function (yaw, pitch, roll, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (space === LIB.Space.LOCAL) {
                var quat = Bone._tmpQuat;
                LIB.Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, quat);
                this.setRotationQuaternion(quat, space, mesh);
                return;
            }
            var rotMatInv = Bone._tmpMats[0];
            if (!this._getNegativeRotationToRef(rotMatInv, mesh)) {
                return;
            }
            var rotMat = Bone._tmpMats[1];
            LIB.Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        /**
         * Add a rotation to the bone on an axis in local or world space
         * @param axis The axis to rotate the bone on
         * @param amount The amount to rotate the bone
         * @param space The space that the axis is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         */
        Bone.prototype.rotate = function (axis, amount, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            var rmat = Bone._tmpMats[0];
            rmat.m[12] = 0;
            rmat.m[13] = 0;
            rmat.m[14] = 0;
            LIB.Matrix.RotationAxisToRef(axis, amount, rmat);
            this._rotateWithMatrix(rmat, space, mesh);
        };
        /**
         * Set the rotation of the bone to a particular axis angle in local or world space
         * @param axis The axis to rotate the bone on
         * @param angle The angle that the bone should be rotated to
         * @param space The space that the axis is in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         */
        Bone.prototype.setAxisAngle = function (axis, angle, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (space === LIB.Space.LOCAL) {
                var quat = Bone._tmpQuat;
                LIB.Quaternion.RotationAxisToRef(axis, angle, quat);
                this.setRotationQuaternion(quat, space, mesh);
                return;
            }
            var rotMatInv = Bone._tmpMats[0];
            if (!this._getNegativeRotationToRef(rotMatInv, mesh)) {
                return;
            }
            var rotMat = Bone._tmpMats[1];
            LIB.Matrix.RotationAxisToRef(axis, angle, rotMat);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        /**
         * Set the euler rotation of the bone in local of world space
         * @param rotation The euler rotation that the bone should be set to
         * @param space The space that the rotation is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         */
        Bone.prototype.setRotation = function (rotation, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            this.setYawPitchRoll(rotation.y, rotation.x, rotation.z, space, mesh);
        };
        /**
         * Set the quaternion rotation of the bone in local of world space
         * @param quat The quaternion rotation that the bone should be set to
         * @param space The space that the rotation is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         */
        Bone.prototype.setRotationQuaternion = function (quat, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (space === LIB.Space.LOCAL) {
                this._decompose();
                this._localRotation.copyFrom(quat);
                this._markAsDirtyAndCompose();
                return;
            }
            var rotMatInv = Bone._tmpMats[0];
            if (!this._getNegativeRotationToRef(rotMatInv, mesh)) {
                return;
            }
            var rotMat = Bone._tmpMats[1];
            LIB.Matrix.FromQuaternionToRef(quat, rotMat);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        /**
         * Set the rotation matrix of the bone in local of world space
         * @param rotMat The rotation matrix that the bone should be set to
         * @param space The space that the rotation is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         */
        Bone.prototype.setRotationMatrix = function (rotMat, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (space === LIB.Space.LOCAL) {
                var quat = Bone._tmpQuat;
                LIB.Quaternion.FromRotationMatrixToRef(rotMat, quat);
                this.setRotationQuaternion(quat, space, mesh);
                return;
            }
            var rotMatInv = Bone._tmpMats[0];
            if (!this._getNegativeRotationToRef(rotMatInv, mesh)) {
                return;
            }
            var rotMat2 = Bone._tmpMats[1];
            rotMat2.copyFrom(rotMat);
            rotMatInv.multiplyToRef(rotMat, rotMat2);
            this._rotateWithMatrix(rotMat2, space, mesh);
        };
        Bone.prototype._rotateWithMatrix = function (rmat, space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            var lmat = this.getLocalMatrix();
            var lx = lmat.m[12];
            var ly = lmat.m[13];
            var lz = lmat.m[14];
            var parent = this.getParent();
            var parentScale = Bone._tmpMats[3];
            var parentScaleInv = Bone._tmpMats[4];
            if (parent && space == LIB.Space.WORLD) {
                if (mesh) {
                    parentScale.copyFrom(mesh.getWorldMatrix());
                    parent.getAbsoluteTransform().multiplyToRef(parentScale, parentScale);
                }
                else {
                    parentScale.copyFrom(parent.getAbsoluteTransform());
                }
                parentScaleInv.copyFrom(parentScale);
                parentScaleInv.invert();
                lmat.multiplyToRef(parentScale, lmat);
                lmat.multiplyToRef(rmat, lmat);
                lmat.multiplyToRef(parentScaleInv, lmat);
            }
            else {
                if (space == LIB.Space.WORLD && mesh) {
                    parentScale.copyFrom(mesh.getWorldMatrix());
                    parentScaleInv.copyFrom(parentScale);
                    parentScaleInv.invert();
                    lmat.multiplyToRef(parentScale, lmat);
                    lmat.multiplyToRef(rmat, lmat);
                    lmat.multiplyToRef(parentScaleInv, lmat);
                }
                else {
                    lmat.multiplyToRef(rmat, lmat);
                }
            }
            lmat.m[12] = lx;
            lmat.m[13] = ly;
            lmat.m[14] = lz;
            this.computeAbsoluteTransforms();
            this._markAsDirtyAndDecompose();
        };
        Bone.prototype._getNegativeRotationToRef = function (rotMatInv, mesh) {
            var scaleMatrix = Bone._tmpMats[2];
            rotMatInv.copyFrom(this.getAbsoluteTransform());
            if (mesh) {
                rotMatInv.multiplyToRef(mesh.getWorldMatrix(), rotMatInv);
                LIB.Matrix.ScalingToRef(mesh.scaling.x, mesh.scaling.y, mesh.scaling.z, scaleMatrix);
            }
            rotMatInv.invert();
            if (isNaN(rotMatInv.m[0])) {
                // Matrix failed to invert.
                // This can happen if scale is zero for example.
                return false;
            }
            scaleMatrix.m[0] *= this._scalingDeterminant;
            rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            return true;
        };
        /**
         * Get the position of the bone in local or world space
         * @param space The space that the returned position is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         * @returns The position of the bone
         */
        Bone.prototype.getPosition = function (space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var pos = LIB.Vector3.Zero();
            this.getPositionToRef(space, mesh, pos);
            return pos;
        };
        /**
         * Copy the position of the bone to a vector3 in local or world space
         * @param space The space that the returned position is in
         * @param mesh The mesh that this bone is attached to. This is only used in world space
         * @param result The vector3 to copy the position to
         */
        Bone.prototype.getPositionToRef = function (space, mesh, result) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (space == LIB.Space.LOCAL) {
                var lm = this.getLocalMatrix();
                result.x = lm.m[12];
                result.y = lm.m[13];
                result.z = lm.m[14];
            }
            else {
                var wm = null;
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh) {
                    wm = mesh.getWorldMatrix();
                }
                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                if (mesh && wm) {
                    tmat.copyFrom(this.getAbsoluteTransform());
                    tmat.multiplyToRef(wm, tmat);
                }
                else {
                    tmat = this.getAbsoluteTransform();
                }
                result.x = tmat.m[12];
                result.y = tmat.m[13];
                result.z = tmat.m[14];
            }
        };
        /**
         * Get the absolute position of the bone (world space)
         * @param mesh The mesh that this bone is attached to
         * @returns The absolute position of the bone
         */
        Bone.prototype.getAbsolutePosition = function (mesh) {
            if (mesh === void 0) { mesh = null; }
            var pos = LIB.Vector3.Zero();
            this.getPositionToRef(LIB.Space.WORLD, mesh, pos);
            return pos;
        };
        /**
         * Copy the absolute position of the bone (world space) to the result param
         * @param mesh The mesh that this bone is attached to
         * @param result The vector3 to copy the absolute position to
         */
        Bone.prototype.getAbsolutePositionToRef = function (mesh, result) {
            this.getPositionToRef(LIB.Space.WORLD, mesh, result);
        };
        /**
         * Compute the absolute transforms of this bone and its children
         */
        Bone.prototype.computeAbsoluteTransforms = function () {
            this._compose();
            if (this._parent) {
                this._localMatrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            }
            else {
                this._absoluteTransform.copyFrom(this._localMatrix);
                var poseMatrix = this._skeleton.getPoseMatrix();
                if (poseMatrix) {
                    this._absoluteTransform.multiplyToRef(poseMatrix, this._absoluteTransform);
                }
            }
            var children = this.children;
            var len = children.length;
            for (var i = 0; i < len; i++) {
                children[i].computeAbsoluteTransforms();
            }
        };
        /**
         * Get the world direction from an axis that is in the local space of the bone
         * @param localAxis The local direction that is used to compute the world direction
         * @param mesh The mesh that this bone is attached to
         * @returns The world direction
         */
        Bone.prototype.getDirection = function (localAxis, mesh) {
            if (mesh === void 0) { mesh = null; }
            var result = LIB.Vector3.Zero();
            this.getDirectionToRef(localAxis, mesh, result);
            return result;
        };
        /**
         * Copy the world direction to a vector3 from an axis that is in the local space of the bone
         * @param localAxis The local direction that is used to compute the world direction
         * @param mesh The mesh that this bone is attached to
         * @param result The vector3 that the world direction will be copied to
         */
        Bone.prototype.getDirectionToRef = function (localAxis, mesh, result) {
            if (mesh === void 0) { mesh = null; }
            var wm = null;
            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if (mesh) {
                wm = mesh.getWorldMatrix();
            }
            this._skeleton.computeAbsoluteTransforms();
            var mat = Bone._tmpMats[0];
            mat.copyFrom(this.getAbsoluteTransform());
            if (mesh && wm) {
                mat.multiplyToRef(wm, mat);
            }
            LIB.Vector3.TransformNormalToRef(localAxis, mat, result);
            result.normalize();
        };
        /**
         * Get the euler rotation of the bone in local or world space
         * @param space The space that the rotation should be in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         * @returns The euler rotation
         */
        Bone.prototype.getRotation = function (space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var result = LIB.Vector3.Zero();
            this.getRotationToRef(space, mesh, result);
            return result;
        };
        /**
         * Copy the euler rotation of the bone to a vector3.  The rotation can be in either local or world space
         * @param space The space that the rotation should be in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         * @param result The vector3 that the rotation should be copied to
         */
        Bone.prototype.getRotationToRef = function (space, mesh, result) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var quat = Bone._tmpQuat;
            this.getRotationQuaternionToRef(space, mesh, quat);
            quat.toEulerAnglesToRef(result);
        };
        /**
         * Get the quaternion rotation of the bone in either local or world space
         * @param space The space that the rotation should be in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         * @returns The quaternion rotation
         */
        Bone.prototype.getRotationQuaternion = function (space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var result = LIB.Quaternion.Identity();
            this.getRotationQuaternionToRef(space, mesh, result);
            return result;
        };
        /**
         * Copy the quaternion rotation of the bone to a quaternion.  The rotation can be in either local or world space
         * @param space The space that the rotation should be in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         * @param result The quaternion that the rotation should be copied to
         */
        Bone.prototype.getRotationQuaternionToRef = function (space, mesh, result) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            if (space == LIB.Space.LOCAL) {
                this._decompose();
                result.copyFrom(this._localRotation);
            }
            else {
                var mat = Bone._tmpMats[0];
                var amat = this.getAbsoluteTransform();
                if (mesh) {
                    amat.multiplyToRef(mesh.getWorldMatrix(), mat);
                }
                else {
                    mat.copyFrom(amat);
                }
                mat.m[0] *= this._scalingDeterminant;
                mat.m[1] *= this._scalingDeterminant;
                mat.m[2] *= this._scalingDeterminant;
                mat.decompose(undefined, result, undefined);
            }
        };
        /**
         * Get the rotation matrix of the bone in local or world space
         * @param space The space that the rotation should be in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         * @returns The rotation matrix
         */
        Bone.prototype.getRotationMatrix = function (space, mesh) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            var result = LIB.Matrix.Identity();
            this.getRotationMatrixToRef(space, mesh, result);
            return result;
        };
        /**
         * Copy the rotation matrix of the bone to a matrix.  The rotation can be in either local or world space
         * @param space The space that the rotation should be in
         * @param mesh The mesh that this bone is attached to.  This is only used in world space
         * @param result The quaternion that the rotation should be copied to
         */
        Bone.prototype.getRotationMatrixToRef = function (space, mesh, result) {
            if (space === void 0) { space = LIB.Space.LOCAL; }
            if (space == LIB.Space.LOCAL) {
                this.getLocalMatrix().getRotationMatrixToRef(result);
            }
            else {
                var mat = Bone._tmpMats[0];
                var amat = this.getAbsoluteTransform();
                if (mesh) {
                    amat.multiplyToRef(mesh.getWorldMatrix(), mat);
                }
                else {
                    mat.copyFrom(amat);
                }
                mat.m[0] *= this._scalingDeterminant;
                mat.m[1] *= this._scalingDeterminant;
                mat.m[2] *= this._scalingDeterminant;
                mat.getRotationMatrixToRef(result);
            }
        };
        /**
         * Get the world position of a point that is in the local space of the bone
         * @param position The local position
         * @param mesh The mesh that this bone is attached to
         * @returns The world position
         */
        Bone.prototype.getAbsolutePositionFromLocal = function (position, mesh) {
            if (mesh === void 0) { mesh = null; }
            var result = LIB.Vector3.Zero();
            this.getAbsolutePositionFromLocalToRef(position, mesh, result);
            return result;
        };
        /**
         * Get the world position of a point that is in the local space of the bone and copy it to the result param
         * @param position The local position
         * @param mesh The mesh that this bone is attached to
         * @param result The vector3 that the world position should be copied to
         */
        Bone.prototype.getAbsolutePositionFromLocalToRef = function (position, mesh, result) {
            if (mesh === void 0) { mesh = null; }
            var wm = null;
            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if (mesh) {
                wm = mesh.getWorldMatrix();
            }
            this._skeleton.computeAbsoluteTransforms();
            var tmat = Bone._tmpMats[0];
            if (mesh && wm) {
                tmat.copyFrom(this.getAbsoluteTransform());
                tmat.multiplyToRef(wm, tmat);
            }
            else {
                tmat = this.getAbsoluteTransform();
            }
            LIB.Vector3.TransformCoordinatesToRef(position, tmat, result);
        };
        /**
         * Get the local position of a point that is in world space
         * @param position The world position
         * @param mesh The mesh that this bone is attached to
         * @returns The local position
         */
        Bone.prototype.getLocalPositionFromAbsolute = function (position, mesh) {
            if (mesh === void 0) { mesh = null; }
            var result = LIB.Vector3.Zero();
            this.getLocalPositionFromAbsoluteToRef(position, mesh, result);
            return result;
        };
        /**
         * Get the local position of a point that is in world space and copy it to the result param
         * @param position The world position
         * @param mesh The mesh that this bone is attached to
         * @param result The vector3 that the local position should be copied to
         */
        Bone.prototype.getLocalPositionFromAbsoluteToRef = function (position, mesh, result) {
            if (mesh === void 0) { mesh = null; }
            var wm = null;
            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if (mesh) {
                wm = mesh.getWorldMatrix();
            }
            this._skeleton.computeAbsoluteTransforms();
            var tmat = Bone._tmpMats[0];
            tmat.copyFrom(this.getAbsoluteTransform());
            if (mesh && wm) {
                tmat.multiplyToRef(wm, tmat);
            }
            tmat.invert();
            LIB.Vector3.TransformCoordinatesToRef(position, tmat, result);
        };
        Bone._tmpVecs = [LIB.Vector3.Zero(), LIB.Vector3.Zero()];
        Bone._tmpQuat = LIB.Quaternion.Identity();
        Bone._tmpMats = [LIB.Matrix.Identity(), LIB.Matrix.Identity(), LIB.Matrix.Identity(), LIB.Matrix.Identity(), LIB.Matrix.Identity()];
        return Bone;
    }(LIB.Node));
    LIB.Bone = Bone;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.bone.js.map
//# sourceMappingURL=LIB.bone.js.map
