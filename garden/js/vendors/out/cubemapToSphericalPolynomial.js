
var LIB;
(function (LIB) {
    var FileFaceOrientation = /** @class */ (function () {
        function FileFaceOrientation(name, worldAxisForNormal, worldAxisForFileX, worldAxisForFileY) {
            this.name = name;
            this.worldAxisForNormal = worldAxisForNormal;
            this.worldAxisForFileX = worldAxisForFileX;
            this.worldAxisForFileY = worldAxisForFileY;
        }
        return FileFaceOrientation;
    }());
    ;
    /**
     * Helper class dealing with the extraction of spherical polynomial dataArray
     * from a cube map.
     */
    var CubeMapToSphericalPolynomialTools = /** @class */ (function () {
        function CubeMapToSphericalPolynomialTools() {
        }
        /**
         * Converts a texture to the according Spherical Polynomial data.
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         *
         * @param texture The texture to extract the information from.
         * @return The Spherical Polynomial data.
         */
        CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial = function (texture) {
            if (!texture.isCube) {
                // Only supports cube Textures currently.
                return null;
            }
            var size = texture.getSize().width;
            var right = texture.readPixels(0);
            var left = texture.readPixels(1);
            var up;
            var down;
            if (texture.isRenderTarget) {
                up = texture.readPixels(3);
                down = texture.readPixels(2);
            }
            else {
                up = texture.readPixels(2);
                down = texture.readPixels(3);
            }
            var front = texture.readPixels(4);
            var back = texture.readPixels(5);
            var gammaSpace = texture.gammaSpace;
            // Always read as RGBA.
            var format = LIB.Engine.TEXTUREFORMAT_RGBA;
            var type = LIB.Engine.TEXTURETYPE_UNSIGNED_INT;
            if (texture.textureType && texture.textureType !== LIB.Engine.TEXTURETYPE_UNSIGNED_INT) {
                type = LIB.Engine.TEXTURETYPE_FLOAT;
            }
            var cubeInfo = {
                size: size,
                right: right,
                left: left,
                up: up,
                down: down,
                front: front,
                back: back,
                format: format,
                type: type,
                gammaSpace: gammaSpace,
            };
            return this.ConvertCubeMapToSphericalPolynomial(cubeInfo);
        };
        /**
         * Converts a cubemap to the according Spherical Polynomial data.
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         *
         * @param cubeInfo The Cube map to extract the information from.
         * @return The Spherical Polynomial data.
         */
        CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial = function (cubeInfo) {
            var sphericalHarmonics = new LIB.SphericalHarmonics();
            var totalSolidAngle = 0.0;
            // The (u,v) range is [-1,+1], so the distance between each texel is 2/Size.
            var du = 2.0 / cubeInfo.size;
            var dv = du;
            // The (u,v) of the first texel is half a texel from the corner (-1,-1).
            var minUV = du * 0.5 - 1.0;
            for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                var fileFace = this.FileFaces[faceIndex];
                var dataArray = cubeInfo[fileFace.name];
                var v = minUV;
                // TODO: we could perform the summation directly into a SphericalPolynomial (SP), which is more efficient than SphericalHarmonic (SH).
                // This is possible because during the summation we do not need the SH-specific properties, e.g. orthogonality.
                // Because SP is still linear, so summation is fine in that basis.
                var stride = cubeInfo.format === LIB.Engine.TEXTUREFORMAT_RGBA ? 4 : 3;
                for (var y = 0; y < cubeInfo.size; y++) {
                    var u = minUV;
                    for (var x = 0; x < cubeInfo.size; x++) {
                        // World direction (not normalised)
                        var worldDirection = fileFace.worldAxisForFileX.scale(u).add(fileFace.worldAxisForFileY.scale(v)).add(fileFace.worldAxisForNormal);
                        worldDirection.normalize();
                        var deltaSolidAngle = Math.pow(1.0 + u * u + v * v, -3.0 / 2.0);
                        var r = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 0];
                        var g = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 1];
                        var b = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 2];
                        // Handle Integer types.
                        if (cubeInfo.type === LIB.Engine.TEXTURETYPE_UNSIGNED_INT) {
                            r /= 255;
                            g /= 255;
                            b /= 255;
                        }
                        // Handle Gamma space textures.
                        if (cubeInfo.gammaSpace) {
                            r = Math.pow(LIB.Scalar.Clamp(r), LIB.ToLinearSpace);
                            g = Math.pow(LIB.Scalar.Clamp(g), LIB.ToLinearSpace);
                            b = Math.pow(LIB.Scalar.Clamp(b), LIB.ToLinearSpace);
                        }
                        var color = new LIB.Color3(r, g, b);
                        sphericalHarmonics.addLight(worldDirection, color, deltaSolidAngle);
                        totalSolidAngle += deltaSolidAngle;
                        u += du;
                    }
                    v += dv;
                }
            }
            // Solid angle for entire sphere is 4*pi
            var sphereSolidAngle = 4.0 * Math.PI;
            // Adjust the solid angle to allow for how many faces we processed.
            var facesProcessed = 6.0;
            var expectedSolidAngle = sphereSolidAngle * facesProcessed / 6.0;
            // Adjust the harmonics so that the accumulated solid angle matches the expected solid angle. 
            // This is needed because the numerical integration over the cube uses a 
            // small angle approximation of solid angle for each texel (see deltaSolidAngle),
            // and also to compensate for accumulative error due to float precision in the summation.
            var correctionFactor = expectedSolidAngle / totalSolidAngle;
            sphericalHarmonics.scale(correctionFactor);
            sphericalHarmonics.convertIncidentRadianceToIrradiance();
            sphericalHarmonics.convertIrradianceToLambertianRadiance();
            return LIB.SphericalPolynomial.getSphericalPolynomialFromHarmonics(sphericalHarmonics);
        };
        CubeMapToSphericalPolynomialTools.FileFaces = [
            new FileFaceOrientation("right", new LIB.Vector3(1, 0, 0), new LIB.Vector3(0, 0, -1), new LIB.Vector3(0, -1, 0)),
            new FileFaceOrientation("left", new LIB.Vector3(-1, 0, 0), new LIB.Vector3(0, 0, 1), new LIB.Vector3(0, -1, 0)),
            new FileFaceOrientation("up", new LIB.Vector3(0, 1, 0), new LIB.Vector3(1, 0, 0), new LIB.Vector3(0, 0, 1)),
            new FileFaceOrientation("down", new LIB.Vector3(0, -1, 0), new LIB.Vector3(1, 0, 0), new LIB.Vector3(0, 0, -1)),
            new FileFaceOrientation("front", new LIB.Vector3(0, 0, 1), new LIB.Vector3(1, 0, 0), new LIB.Vector3(0, -1, 0)),
            new FileFaceOrientation("back", new LIB.Vector3(0, 0, -1), new LIB.Vector3(-1, 0, 0), new LIB.Vector3(0, -1, 0)) // -Z bottom
        ];
        return CubeMapToSphericalPolynomialTools;
    }());
    LIB.CubeMapToSphericalPolynomialTools = CubeMapToSphericalPolynomialTools;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.cubemapToSphericalPolynomial.js.map
//# sourceMappingURL=LIB.cubemapToSphericalPolynomial.js.map
