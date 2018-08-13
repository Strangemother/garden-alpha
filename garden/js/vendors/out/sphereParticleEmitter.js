

var LIB;
(function (LIB) {
    /**
     * Particle emitter emitting particles from the inside of a sphere.
     * It emits the particles alongside the sphere radius. The emission direction might be randomized.
     */
    var SphereParticleEmitter = /** @class */ (function () {
        /**
         * Creates a new instance SphereParticleEmitter
         * @param radius the radius of the emission sphere (1 by default)
         * @param directionRandomizer defines how much to randomize the particle direction [0-1]
         */
        function SphereParticleEmitter(
        /**
         * The radius of the emission sphere.
         */
        radius, 
        /**
         * How much to randomize the particle direction [0-1].
         */
        directionRandomizer) {
            if (radius === void 0) { radius = 1; }
            if (directionRandomizer === void 0) { directionRandomizer = 0; }
            this.radius = radius;
            this.directionRandomizer = directionRandomizer;
        }
        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        SphereParticleEmitter.prototype.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
            var direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
            var randX = LIB.Scalar.RandomRange(0, this.directionRandomizer);
            var randY = LIB.Scalar.RandomRange(0, this.directionRandomizer);
            var randZ = LIB.Scalar.RandomRange(0, this.directionRandomizer);
            direction.x += randX;
            direction.y += randY;
            direction.z += randZ;
            direction.normalize();
            LIB.Vector3.TransformNormalFromFloatsToRef(direction.x * emitPower, direction.y * emitPower, direction.z * emitPower, worldMatrix, directionToUpdate);
        };
        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        SphereParticleEmitter.prototype.startPositionFunction = function (worldMatrix, positionToUpdate, particle) {
            var phi = LIB.Scalar.RandomRange(0, 2 * Math.PI);
            var theta = LIB.Scalar.RandomRange(0, Math.PI);
            var randRadius = LIB.Scalar.RandomRange(0, this.radius);
            var randX = randRadius * Math.cos(phi) * Math.sin(theta);
            var randY = randRadius * Math.cos(theta);
            var randZ = randRadius * Math.sin(phi) * Math.sin(theta);
            LIB.Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        };
        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        SphereParticleEmitter.prototype.clone = function () {
            var newOne = new SphereParticleEmitter(this.radius, this.directionRandomizer);
            LIB.Tools.DeepCopy(this, newOne);
            return newOne;
        };
        /**
         * Called by the {LIB.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */
        SphereParticleEmitter.prototype.applyToShader = function (effect) {
            effect.setFloat("radius", this.radius);
            effect.setFloat("directionRandomizer", this.directionRandomizer);
        };
        /**
         * Returns a string to use to update the GPU particles update shader
         * @returns a string containng the defines string
         */
        SphereParticleEmitter.prototype.getEffectDefines = function () {
            return "#define SPHEREEMITTER";
        };
        /**
         * Returns the string "SphereParticleEmitter"
         * @returns a string containing the class name
         */
        SphereParticleEmitter.prototype.getClassName = function () {
            return "SphereParticleEmitter";
        };
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */
        SphereParticleEmitter.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.type = this.getClassName();
            serializationObject.radius = this.radius;
            serializationObject.directionRandomizer = this.directionRandomizer;
            return serializationObject;
        };
        /**
         * Parse properties from a JSON object
         * @param serializationObject defines the JSON object
         */
        SphereParticleEmitter.prototype.parse = function (serializationObject) {
            this.radius = serializationObject.radius;
            this.directionRandomizer = serializationObject.directionRandomizer;
        };
        return SphereParticleEmitter;
    }());
    LIB.SphereParticleEmitter = SphereParticleEmitter;
    /**
     * Particle emitter emitting particles from the inside of a sphere.
     * It emits the particles randomly between two vectors.
     */
    var SphereDirectedParticleEmitter = /** @class */ (function (_super) {
        __extends(SphereDirectedParticleEmitter, _super);
        /**
         * Creates a new instance SphereDirectedParticleEmitter
         * @param radius the radius of the emission sphere (1 by default)
         * @param direction1 the min limit of the emission direction (up vector by default)
         * @param direction2 the max limit of the emission direction (up vector by default)
         */
        function SphereDirectedParticleEmitter(radius, 
        /**
         * The min limit of the emission direction.
         */
        direction1, 
        /**
         * The max limit of the emission direction.
         */
        direction2) {
            if (radius === void 0) { radius = 1; }
            if (direction1 === void 0) { direction1 = new LIB.Vector3(0, 1, 0); }
            if (direction2 === void 0) { direction2 = new LIB.Vector3(0, 1, 0); }
            var _this = _super.call(this, radius) || this;
            _this.direction1 = direction1;
            _this.direction2 = direction2;
            return _this;
        }
        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        SphereDirectedParticleEmitter.prototype.startDirectionFunction = function (emitPower, worldMatrix, directionToUpdate, particle) {
            var randX = LIB.Scalar.RandomRange(this.direction1.x, this.direction2.x);
            var randY = LIB.Scalar.RandomRange(this.direction1.y, this.direction2.y);
            var randZ = LIB.Scalar.RandomRange(this.direction1.z, this.direction2.z);
            LIB.Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        };
        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        SphereDirectedParticleEmitter.prototype.clone = function () {
            var newOne = new SphereDirectedParticleEmitter(this.radius, this.direction1, this.direction2);
            LIB.Tools.DeepCopy(this, newOne);
            return newOne;
        };
        /**
         * Called by the {LIB.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */
        SphereDirectedParticleEmitter.prototype.applyToShader = function (effect) {
            effect.setFloat("radius", this.radius);
            effect.setVector3("direction1", this.direction1);
            effect.setVector3("direction2", this.direction2);
        };
        /**
         * Returns a string to use to update the GPU particles update shader
         * @returns a string containng the defines string
         */
        SphereDirectedParticleEmitter.prototype.getEffectDefines = function () {
            return "#define SPHEREEMITTER\n#define DIRECTEDSPHEREEMITTER";
        };
        /**
         * Returns the string "SphereDirectedParticleEmitter"
         * @returns a string containing the class name
         */
        SphereDirectedParticleEmitter.prototype.getClassName = function () {
            return "SphereDirectedParticleEmitter";
        };
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */
        SphereDirectedParticleEmitter.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.direction1 = this.direction1.asArray();
            serializationObject.direction2 = this.direction2.asArray();
            return serializationObject;
        };
        /**
         * Parse properties from a JSON object
         * @param serializationObject defines the JSON object
         */
        SphereDirectedParticleEmitter.prototype.parse = function (serializationObject) {
            _super.prototype.parse.call(this, serializationObject);
            this.direction1.copyFrom(serializationObject.direction1);
            this.direction2.copyFrom(serializationObject.direction2);
        };
        return SphereDirectedParticleEmitter;
    }(SphereParticleEmitter));
    LIB.SphereDirectedParticleEmitter = SphereDirectedParticleEmitter;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.sphereParticleEmitter.js.map
//# sourceMappingURL=LIB.sphereParticleEmitter.js.map
