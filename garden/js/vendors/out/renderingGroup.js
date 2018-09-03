
var LIB;
(function (LIB) {
    var RenderingGroup = /** @class */ (function () {
        /**
         * Creates a new rendering group.
         * @param index The rendering group index
         * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
         * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
         * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
         */
        function RenderingGroup(index, scene, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn) {
            if (opaqueSortCompareFn === void 0) { opaqueSortCompareFn = null; }
            if (alphaTestSortCompareFn === void 0) { alphaTestSortCompareFn = null; }
            if (transparentSortCompareFn === void 0) { transparentSortCompareFn = null; }
            this.index = index;
            this._opaqueSubMeshes = new LIB.SmartArray(256);
            this._transparentSubMeshes = new LIB.SmartArray(256);
            this._alphaTestSubMeshes = new LIB.SmartArray(256);
            this._depthOnlySubMeshes = new LIB.SmartArray(256);
            this._particleSystems = new LIB.SmartArray(256);
            this._spriteManagers = new LIB.SmartArray(256);
            this._edgesRenderers = new LIB.SmartArray(16);
            this._scene = scene;
            this.opaqueSortCompareFn = opaqueSortCompareFn;
            this.alphaTestSortCompareFn = alphaTestSortCompareFn;
            this.transparentSortCompareFn = transparentSortCompareFn;
        }
        Object.defineProperty(RenderingGroup.prototype, "opaqueSortCompareFn", {
            /**
             * Set the opaque sort comparison function.
             * If null the sub meshes will be render in the order they were created
             */
            set: function (value) {
                this._opaqueSortCompareFn = value;
                if (value) {
                    this._renderOpaque = this.renderOpaqueSorted;
                }
                else {
                    this._renderOpaque = RenderingGroup.renderUnsorted;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderingGroup.prototype, "alphaTestSortCompareFn", {
            /**
             * Set the alpha test sort comparison function.
             * If null the sub meshes will be render in the order they were created
             */
            set: function (value) {
                this._alphaTestSortCompareFn = value;
                if (value) {
                    this._renderAlphaTest = this.renderAlphaTestSorted;
                }
                else {
                    this._renderAlphaTest = RenderingGroup.renderUnsorted;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderingGroup.prototype, "transparentSortCompareFn", {
            /**
             * Set the transparent sort comparison function.
             * If null the sub meshes will be render in the order they were created
             */
            set: function (value) {
                if (value) {
                    this._transparentSortCompareFn = value;
                }
                else {
                    this._transparentSortCompareFn = RenderingGroup.defaultTransparentSortCompare;
                }
                this._renderTransparent = this.renderTransparentSorted;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Render all the sub meshes contained in the group.
         * @param customRenderFunction Used to override the default render behaviour of the group.
         * @returns true if rendered some submeshes.
         */
        RenderingGroup.prototype.render = function (customRenderFunction, renderSprites, renderParticles, activeMeshes) {
            if (customRenderFunction) {
                customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, this._depthOnlySubMeshes);
                return;
            }
            var engine = this._scene.getEngine();
            // Depth only
            if (this._depthOnlySubMeshes.length !== 0) {
                engine.setColorWrite(false);
                this._renderAlphaTest(this._depthOnlySubMeshes);
                engine.setColorWrite(true);
            }
            // Opaque
            if (this._opaqueSubMeshes.length !== 0) {
                this._renderOpaque(this._opaqueSubMeshes);
            }
            // Alpha test
            if (this._alphaTestSubMeshes.length !== 0) {
                this._renderAlphaTest(this._alphaTestSubMeshes);
            }
            var stencilState = engine.getStencilBuffer();
            engine.setStencilBuffer(false);
            // Sprites
            if (renderSprites) {
                this._renderSprites();
            }
            // Particles
            if (renderParticles) {
                this._renderParticles(activeMeshes);
            }
            if (this.onBeforeTransparentRendering) {
                this.onBeforeTransparentRendering();
            }
            // Transparent
            if (this._transparentSubMeshes.length !== 0) {
                this._renderTransparent(this._transparentSubMeshes);
                engine.setAlphaMode(LIB.Engine.ALPHA_DISABLE);
            }
            // Set back stencil to false in case it changes before the edge renderer.
            engine.setStencilBuffer(false);
            // Edges
            for (var edgesRendererIndex = 0; edgesRendererIndex < this._edgesRenderers.length; edgesRendererIndex++) {
                this._edgesRenderers.data[edgesRendererIndex].render();
            }
            // Restore Stencil state.
            engine.setStencilBuffer(stencilState);
        };
        /**
         * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.prototype.renderOpaqueSorted = function (subMeshes) {
            return RenderingGroup.renderSorted(subMeshes, this._opaqueSortCompareFn, this._scene.activeCamera, false);
        };
        /**
         * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.prototype.renderAlphaTestSorted = function (subMeshes) {
            return RenderingGroup.renderSorted(subMeshes, this._alphaTestSortCompareFn, this._scene.activeCamera, false);
        };
        /**
         * Renders the opaque submeshes in the order from the transparentSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.prototype.renderTransparentSorted = function (subMeshes) {
            return RenderingGroup.renderSorted(subMeshes, this._transparentSortCompareFn, this._scene.activeCamera, true);
        };
        /**
         * Renders the submeshes in a specified order.
         * @param subMeshes The submeshes to sort before render
         * @param sortCompareFn The comparison function use to sort
         * @param cameraPosition The camera position use to preprocess the submeshes to help sorting
         * @param transparent Specifies to activate blending if true
         */
        RenderingGroup.renderSorted = function (subMeshes, sortCompareFn, camera, transparent) {
            var subIndex = 0;
            var subMesh;
            var cameraPosition = camera ? camera.globalPosition : LIB.Vector3.Zero();
            for (; subIndex < subMeshes.length; subIndex++) {
                subMesh = subMeshes.data[subIndex];
                subMesh._alphaIndex = subMesh.getMesh().alphaIndex;
                subMesh._distanceToCamera = subMesh.getBoundingInfo().boundingSphere.centerWorld.subtract(cameraPosition).length();
            }
            var sortedArray = subMeshes.data.slice(0, subMeshes.length);
            if (sortCompareFn) {
                sortedArray.sort(sortCompareFn);
            }
            for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                subMesh = sortedArray[subIndex];
                if (transparent) {
                    var material = subMesh.getMaterial();
                    if (material && material.needDepthPrePass) {
                        var engine = material.getScene().getEngine();
                        engine.setColorWrite(false);
                        engine.setAlphaMode(LIB.Engine.ALPHA_DISABLE);
                        subMesh.render(false);
                        engine.setColorWrite(true);
                    }
                }
                subMesh.render(transparent);
            }
        };
        /**
         * Renders the submeshes in the order they were dispatched (no sort applied).
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.renderUnsorted = function (subMeshes) {
            for (var subIndex = 0; subIndex < subMeshes.length; subIndex++) {
                var submesh = subMeshes.data[subIndex];
                submesh.render(false);
            }
        };
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front if in the same alpha index.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        RenderingGroup.defaultTransparentSortCompare = function (a, b) {
            // Alpha index first
            if (a._alphaIndex > b._alphaIndex) {
                return 1;
            }
            if (a._alphaIndex < b._alphaIndex) {
                return -1;
            }
            // Then distance to camera
            return RenderingGroup.backToFrontSortCompare(a, b);
        };
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        RenderingGroup.backToFrontSortCompare = function (a, b) {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return 1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return -1;
            }
            return 0;
        };
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered front to back (prevent overdraw).
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        RenderingGroup.frontToBackSortCompare = function (a, b) {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return -1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return 1;
            }
            return 0;
        };
        /**
         * Resets the different lists of submeshes to prepare a new frame.
         */
        RenderingGroup.prototype.prepare = function () {
            this._opaqueSubMeshes.reset();
            this._transparentSubMeshes.reset();
            this._alphaTestSubMeshes.reset();
            this._depthOnlySubMeshes.reset();
            this._particleSystems.reset();
            this._spriteManagers.reset();
            this._edgesRenderers.reset();
        };
        RenderingGroup.prototype.dispose = function () {
            this._opaqueSubMeshes.dispose();
            this._transparentSubMeshes.dispose();
            this._alphaTestSubMeshes.dispose();
            this._depthOnlySubMeshes.dispose();
            this._particleSystems.dispose();
            this._spriteManagers.dispose();
            this._edgesRenderers.dispose();
        };
        /**
         * Inserts the submesh in its correct queue depending on its material.
         * @param subMesh The submesh to dispatch
         * @param [mesh] Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
         * @param [material] Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
         */
        RenderingGroup.prototype.dispatch = function (subMesh, mesh, material) {
            // Get mesh and materials if not provided
            if (mesh === undefined) {
                mesh = subMesh.getMesh();
            }
            if (material === undefined) {
                material = subMesh.getMaterial();
            }
            if (material === null || material === undefined) {
                return;
            }
            if (material.needAlphaBlendingForMesh(mesh)) { // Transparent
                this._transparentSubMeshes.push(subMesh);
            }
            else if (material.needAlphaTesting()) { // Alpha test
                if (material.needDepthPrePass) {
                    this._depthOnlySubMeshes.push(subMesh);
                }
                this._alphaTestSubMeshes.push(subMesh);
            }
            else {
                if (material.needDepthPrePass) {
                    this._depthOnlySubMeshes.push(subMesh);
                }
                this._opaqueSubMeshes.push(subMesh); // Opaque
            }
            if (mesh._edgesRenderer !== null && mesh._edgesRenderer !== undefined) {
                this._edgesRenderers.push(mesh._edgesRenderer);
            }
        };
        RenderingGroup.prototype.dispatchSprites = function (spriteManager) {
            this._spriteManagers.push(spriteManager);
        };
        RenderingGroup.prototype.dispatchParticles = function (particleSystem) {
            this._particleSystems.push(particleSystem);
        };
        RenderingGroup.prototype._renderParticles = function (activeMeshes) {
            if (this._particleSystems.length === 0) {
                return;
            }
            // Particles
            var activeCamera = this._scene.activeCamera;
            this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
            for (var particleIndex = 0; particleIndex < this._particleSystems.length; particleIndex++) {
                var particleSystem = this._particleSystems.data[particleIndex];
                if ((activeCamera && activeCamera.layerMask & particleSystem.layerMask) === 0) {
                    continue;
                }
                var emitter = particleSystem.emitter;
                if (!emitter.position || !activeMeshes || activeMeshes.indexOf(emitter) !== -1) {
                    this._scene._activeParticles.addCount(particleSystem.render(), false);
                }
            }
            this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
        };
        RenderingGroup.prototype._renderSprites = function () {
            if (!this._scene.spritesEnabled || this._spriteManagers.length === 0) {
                return;
            }
            // Sprites       
            var activeCamera = this._scene.activeCamera;
            this._scene.onBeforeSpritesRenderingObservable.notifyObservers(this._scene);
            for (var id = 0; id < this._spriteManagers.length; id++) {
                var spriteManager = this._spriteManagers.data[id];
                if (((activeCamera && activeCamera.layerMask & spriteManager.layerMask) !== 0)) {
                    spriteManager.render();
                }
            }
            this._scene.onAfterSpritesRenderingObservable.notifyObservers(this._scene);
        };
        return RenderingGroup;
    }());
    LIB.RenderingGroup = RenderingGroup;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.renderingGroup.js.map
//# sourceMappingURL=LIB.renderingGroup.js.map