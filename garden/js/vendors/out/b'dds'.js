
var LIB;
(function (LIB) {
    // Based on demo done by Brandon Jones - http://media.tojicode.com/webgl-samples/dds.html
    // All values and structures referenced from:
    // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
    var DDS_MAGIC = 0x20534444;
    var 
    //DDSD_CAPS = 0x1,
    //DDSD_HEIGHT = 0x2,
    //DDSD_WIDTH = 0x4,
    //DDSD_PITCH = 0x8,
    //DDSD_PIXELFORMAT = 0x1000,
    DDSD_MIPMAPCOUNT = 0x20000;
    //DDSD_LINEARSIZE = 0x80000,
    //DDSD_DEPTH = 0x800000;
    // var DDSCAPS_COMPLEX = 0x8,
    //     DDSCAPS_MIPMAP = 0x400000,
    //     DDSCAPS_TEXTURE = 0x1000;
    var DDSCAPS2_CUBEMAP = 0x200;
    // DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
    // DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
    // DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
    // DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
    // DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
    // DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000,
    // DDSCAPS2_VOLUME = 0x200000;
    var 
    //DDPF_ALPHAPIXELS = 0x1,
    //DDPF_ALPHA = 0x2,
    DDPF_FOURCC = 0x4, DDPF_RGB = 0x40, 
    //DDPF_YUV = 0x200,
    DDPF_LUMINANCE = 0x20000;
    function FourCCToInt32(value) {
        return value.charCodeAt(0) +
            (value.charCodeAt(1) << 8) +
            (value.charCodeAt(2) << 16) +
            (value.charCodeAt(3) << 24);
    }
    function Int32ToFourCC(value) {
        return String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
    }
    var FOURCC_DXT1 = FourCCToInt32("DXT1");
    var FOURCC_DXT3 = FourCCToInt32("DXT3");
    var FOURCC_DXT5 = FourCCToInt32("DXT5");
    var FOURCC_DX10 = FourCCToInt32("DX10");
    var FOURCC_D3DFMT_R16G16B16A16F = 113;
    var FOURCC_D3DFMT_R32G32B32A32F = 116;
    var DXGI_FORMAT_R16G16B16A16_FLOAT = 10;
    var DXGI_FORMAT_B8G8R8X8_UNORM = 88;
    var headerLengthInt = 31; // The header length in 32 bit ints
    // Offsets into the header array
    var off_magic = 0;
    var off_size = 1;
    var off_flags = 2;
    var off_height = 3;
    var off_width = 4;
    var off_mipmapCount = 7;
    var off_pfFlags = 20;
    var off_pfFourCC = 21;
    var off_RGBbpp = 22;
    var off_RMask = 23;
    var off_GMask = 24;
    var off_BMask = 25;
    var off_AMask = 26;
    // var off_caps1 = 27;
    var off_caps2 = 28;
    // var off_caps3 = 29;
    // var off_caps4 = 30;
    var off_dxgiFormat = 32;
    ;
    var DDSTools = /** @class */ (function () {
        function DDSTools() {
        }
        DDSTools.GetDDSInfo = function (arrayBuffer) {
            var header = new Int32Array(arrayBuffer, 0, headerLengthInt);
            var extendedHeader = new Int32Array(arrayBuffer, 0, headerLengthInt + 4);
            var mipmapCount = 1;
            if (header[off_flags] & DDSD_MIPMAPCOUNT) {
                mipmapCount = Math.max(1, header[off_mipmapCount]);
            }
            var fourCC = header[off_pfFourCC];
            var dxgiFormat = (fourCC === FOURCC_DX10) ? extendedHeader[off_dxgiFormat] : 0;
            var textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT;
            switch (fourCC) {
                case FOURCC_D3DFMT_R16G16B16A16F:
                    textureType = LIB.Engine.TEXTURETYPE_HALF_FLOAT;
                    break;
                case FOURCC_D3DFMT_R32G32B32A32F:
                    textureType = LIB.Engine.TEXTURETYPE_FLOAT;
                    break;
                case FOURCC_DX10:
                    if (dxgiFormat === DXGI_FORMAT_R16G16B16A16_FLOAT) {
                        textureType = LIB.Engine.TEXTURETYPE_HALF_FLOAT;
                        break;
                    }
            }
            return {
                width: header[off_width],
                height: header[off_height],
                mipmapCount: mipmapCount,
                isFourCC: (header[off_pfFlags] & DDPF_FOURCC) === DDPF_FOURCC,
                isRGB: (header[off_pfFlags] & DDPF_RGB) === DDPF_RGB,
                isLuminance: (header[off_pfFlags] & DDPF_LUMINANCE) === DDPF_LUMINANCE,
                isCube: (header[off_caps2] & DDSCAPS2_CUBEMAP) === DDSCAPS2_CUBEMAP,
                isCompressed: (fourCC === FOURCC_DXT1 || fourCC === FOURCC_DXT3 || fourCC === FOURCC_DXT5),
                dxgiFormat: dxgiFormat,
                textureType: textureType
            };
        };
        DDSTools._ToHalfFloat = function (value) {
            if (!DDSTools._FloatView) {
                DDSTools._FloatView = new Float32Array(1);
                DDSTools._Int32View = new Int32Array(DDSTools._FloatView.buffer);
            }
            DDSTools._FloatView[0] = value;
            var x = DDSTools._Int32View[0];
            var bits = (x >> 16) & 0x8000; /* Get the sign */
            var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
            var e = (x >> 23) & 0xff; /* Using int is faster here */
            /* If zero, or denormal, or exponent underflows too much for a denormal
            * half, return signed zero. */
            if (e < 103) {
                return bits;
            }
            /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
            if (e > 142) {
                bits |= 0x7c00;
                /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                * not Inf, so make sure we set one mantissa bit too. */
                bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
                return bits;
            }
            /* If exponent underflows but not too much, return a denormal */
            if (e < 113) {
                m |= 0x0800;
                /* Extra rounding may overflow and set mantissa to 0 and exponent
                * to 1, which is OK. */
                bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
                return bits;
            }
            bits |= ((e - 112) << 10) | (m >> 1);
            bits += m & 1;
            return bits;
        };
        DDSTools._FromHalfFloat = function (value) {
            var s = (value & 0x8000) >> 15;
            var e = (value & 0x7C00) >> 10;
            var f = value & 0x03FF;
            if (e === 0) {
                return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
            }
            else if (e == 0x1F) {
                return f ? NaN : ((s ? -1 : 1) * Infinity);
            }
            return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
        };
        DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, lod) {
            var destArray = new Float32Array(dataLength);
            var srcData = new Uint16Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 4;
                    destArray[index] = DDSTools._FromHalfFloat(srcData[srcPos]);
                    destArray[index + 1] = DDSTools._FromHalfFloat(srcData[srcPos + 1]);
                    destArray[index + 2] = DDSTools._FromHalfFloat(srcData[srcPos + 2]);
                    if (DDSTools.StoreLODInAlphaChannel) {
                        destArray[index + 3] = lod;
                    }
                    else {
                        destArray[index + 3] = DDSTools._FromHalfFloat(srcData[srcPos + 3]);
                    }
                    index += 4;
                }
            }
            return destArray;
        };
        DDSTools._GetHalfFloatRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, lod) {
            if (DDSTools.StoreLODInAlphaChannel) {
                var destArray = new Uint16Array(dataLength);
                var srcData = new Uint16Array(arrayBuffer, dataOffset);
                var index = 0;
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        var srcPos = (x + y * width) * 4;
                        destArray[index] = srcData[srcPos];
                        destArray[index + 1] = srcData[srcPos + 1];
                        destArray[index + 2] = srcData[srcPos + 2];
                        destArray[index + 3] = DDSTools._ToHalfFloat(lod);
                        index += 4;
                    }
                }
                return destArray;
            }
            return new Uint16Array(arrayBuffer, dataOffset, dataLength);
        };
        DDSTools._GetFloatRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, lod) {
            if (DDSTools.StoreLODInAlphaChannel) {
                var destArray = new Float32Array(dataLength);
                var srcData = new Float32Array(arrayBuffer, dataOffset);
                var index = 0;
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        var srcPos = (x + y * width) * 4;
                        destArray[index] = srcData[srcPos];
                        destArray[index + 1] = srcData[srcPos + 1];
                        destArray[index + 2] = srcData[srcPos + 2];
                        destArray[index + 3] = lod;
                        index += 4;
                    }
                }
                return destArray;
            }
            return new Float32Array(arrayBuffer, dataOffset, dataLength);
        };
        DDSTools._GetFloatAsUIntRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, lod) {
            var destArray = new Uint8Array(dataLength);
            var srcData = new Float32Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 4;
                    destArray[index] = LIB.Scalar.Clamp(srcData[srcPos]) * 255;
                    destArray[index + 1] = LIB.Scalar.Clamp(srcData[srcPos + 1]) * 255;
                    destArray[index + 2] = LIB.Scalar.Clamp(srcData[srcPos + 2]) * 255;
                    if (DDSTools.StoreLODInAlphaChannel) {
                        destArray[index + 3] = lod;
                    }
                    else {
                        destArray[index + 3] = LIB.Scalar.Clamp(srcData[srcPos + 3]) * 255;
                    }
                    index += 4;
                }
            }
            return destArray;
        };
        DDSTools._GetHalfFloatAsUIntRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, lod) {
            var destArray = new Uint8Array(dataLength);
            var srcData = new Uint16Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 4;
                    destArray[index] = LIB.Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos])) * 255;
                    destArray[index + 1] = LIB.Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos + 1])) * 255;
                    destArray[index + 2] = LIB.Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos + 2])) * 255;
                    if (DDSTools.StoreLODInAlphaChannel) {
                        destArray[index + 3] = lod;
                    }
                    else {
                        destArray[index + 3] = LIB.Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos + 3])) * 255;
                    }
                    index += 4;
                }
            }
            return destArray;
        };
        DDSTools._GetRGBAArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, rOffset, gOffset, bOffset, aOffset) {
            var byteArray = new Uint8Array(dataLength);
            var srcData = new Uint8Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 4;
                    byteArray[index] = srcData[srcPos + rOffset];
                    byteArray[index + 1] = srcData[srcPos + gOffset];
                    byteArray[index + 2] = srcData[srcPos + bOffset];
                    byteArray[index + 3] = srcData[srcPos + aOffset];
                    index += 4;
                }
            }
            return byteArray;
        };
        DDSTools._ExtractLongWordOrder = function (value) {
            if (value === 0 || value === 255 || value === -16777216) {
                return 0;
            }
            return 1 + DDSTools._ExtractLongWordOrder(value >> 8);
        };
        DDSTools._GetRGBArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer, rOffset, gOffset, bOffset) {
            var byteArray = new Uint8Array(dataLength);
            var srcData = new Uint8Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 3;
                    byteArray[index] = srcData[srcPos + rOffset];
                    byteArray[index + 1] = srcData[srcPos + gOffset];
                    byteArray[index + 2] = srcData[srcPos + bOffset];
                    index += 3;
                }
            }
            return byteArray;
        };
        DDSTools._GetLuminanceArrayBuffer = function (width, height, dataOffset, dataLength, arrayBuffer) {
            var byteArray = new Uint8Array(dataLength);
            var srcData = new Uint8Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width);
                    byteArray[index] = srcData[srcPos];
                    index++;
                }
            }
            return byteArray;
        };
        DDSTools.UploadDDSLevels = function (engine, gl, arrayBuffer, info, loadMipmaps, faces, lodIndex, currentFace) {
            if (lodIndex === void 0) { lodIndex = -1; }
            var sphericalPolynomialFaces = null;
            if (info.sphericalPolynomial) {
                sphericalPolynomialFaces = new Array();
            }
            var ext = engine.getCaps().s3tc;
            var header = new Int32Array(arrayBuffer, 0, headerLengthInt);
            var fourCC, width, height, dataLength = 0, dataOffset;
            var byteArray, mipmapCount, mip;
            var internalFormat = 0;
            var format = 0;
            var blockBytes = 1;
            if (header[off_magic] !== DDS_MAGIC) {
                LIB.Tools.Error("Invalid magic number in DDS header");
                return;
            }
            if (!info.isFourCC && !info.isRGB && !info.isLuminance) {
                LIB.Tools.Error("Unsupported format, must contain a FourCC, RGB or LUMINANCE code");
                return;
            }
            if (info.isCompressed && !ext) {
                LIB.Tools.Error("Compressed textures are not supported on this platform.");
                return;
            }
            var bpp = header[off_RGBbpp];
            dataOffset = header[off_size] + 4;
            var computeFormats = false;
            if (info.isFourCC) {
                fourCC = header[off_pfFourCC];
                switch (fourCC) {
                    case FOURCC_DXT1:
                        blockBytes = 8;
                        internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT1_EXT;
                        break;
                    case FOURCC_DXT3:
                        blockBytes = 16;
                        internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT3_EXT;
                        break;
                    case FOURCC_DXT5:
                        blockBytes = 16;
                        internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                        break;
                    case FOURCC_D3DFMT_R16G16B16A16F:
                        computeFormats = true;
                        break;
                    case FOURCC_D3DFMT_R32G32B32A32F:
                        computeFormats = true;
                        break;
                    case FOURCC_DX10:
                        // There is an additionnal header so dataOffset need to be changed
                        dataOffset += 5 * 4; // 5 uints
                        var supported = false;
                        switch (info.dxgiFormat) {
                            case DXGI_FORMAT_R16G16B16A16_FLOAT:
                                computeFormats = true;
                                supported = true;
                                break;
                            case DXGI_FORMAT_B8G8R8X8_UNORM:
                                info.isRGB = true;
                                info.isFourCC = false;
                                bpp = 32;
                                supported = true;
                                break;
                        }
                        if (supported) {
                            break;
                        }
                    default:
                        console.error("Unsupported FourCC code:", Int32ToFourCC(fourCC));
                        return;
                }
            }
            var rOffset = DDSTools._ExtractLongWordOrder(header[off_RMask]);
            var gOffset = DDSTools._ExtractLongWordOrder(header[off_GMask]);
            var bOffset = DDSTools._ExtractLongWordOrder(header[off_BMask]);
            var aOffset = DDSTools._ExtractLongWordOrder(header[off_AMask]);
            if (computeFormats) {
                format = engine._getWebGLTextureType(info.textureType);
                internalFormat = engine._getRGBABufferInternalSizedFormat(info.textureType);
            }
            mipmapCount = 1;
            if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
                mipmapCount = Math.max(1, header[off_mipmapCount]);
            }
            for (var face = 0; face < faces; face++) {
                var sampler = faces === 1 ? gl.TEXTURE_2D : (gl.TEXTURE_CUBE_MAP_POSITIVE_X + face + (currentFace ? currentFace : 0));
                width = header[off_width];
                height = header[off_height];
                for (mip = 0; mip < mipmapCount; ++mip) {
                    if (lodIndex === -1 || lodIndex === mip) {
                        // In case of fixed LOD, if the lod has just been uploaded, early exit.
                        var i = (lodIndex === -1) ? mip : 0;
                        if (!info.isCompressed && info.isFourCC) {
                            dataLength = width * height * 4;
                            var floatArray = null;
                            if (engine._badOS || engine._badDesktopOS || (!engine.getCaps().textureHalfFloat && !engine.getCaps().textureFloat)) { // Required because iOS has many issues with float and half float generation
                                if (bpp === 128) {
                                    floatArray = DDSTools._GetFloatAsUIntRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i);
                                    if (sphericalPolynomialFaces && i == 0) {
                                        sphericalPolynomialFaces.push(DDSTools._GetFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i));
                                    }
                                }
                                else if (bpp === 64) {
                                    floatArray = DDSTools._GetHalfFloatAsUIntRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i);
                                    if (sphericalPolynomialFaces && i == 0) {
                                        sphericalPolynomialFaces.push(DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i));
                                    }
                                }
                                info.textureType = LIB.Engine.TEXTURETYPE_UNSIGNED_INT;
                                format = engine._getWebGLTextureType(info.textureType);
                                internalFormat = engine._getRGBABufferInternalSizedFormat(info.textureType);
                            }
                            else {
                                if (bpp === 128) {
                                    floatArray = DDSTools._GetFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i);
                                    if (sphericalPolynomialFaces && i == 0) {
                                        sphericalPolynomialFaces.push(floatArray);
                                    }
                                }
                                else if (bpp === 64 && !engine.getCaps().textureHalfFloat) {
                                    floatArray = DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i);
                                    if (sphericalPolynomialFaces && i == 0) {
                                        sphericalPolynomialFaces.push(floatArray);
                                    }
                                    info.textureType = LIB.Engine.TEXTURETYPE_FLOAT;
                                    format = engine._getWebGLTextureType(info.textureType);
                                    internalFormat = engine._getRGBABufferInternalSizedFormat(info.textureType);
                                }
                                else { // 64
                                    floatArray = DDSTools._GetHalfFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i);
                                    if (sphericalPolynomialFaces && i == 0) {
                                        sphericalPolynomialFaces.push(DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, i));
                                    }
                                }
                            }
                            if (floatArray) {
                                engine._uploadDataToTexture(sampler, i, internalFormat, width, height, gl.RGBA, format, floatArray);
                            }
                        }
                        else if (info.isRGB) {
                            if (bpp === 24) {
                                dataLength = width * height * 3;
                                byteArray = DDSTools._GetRGBArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, rOffset, gOffset, bOffset);
                                engine._uploadDataToTexture(sampler, i, gl.RGB, width, height, gl.RGB, gl.UNSIGNED_BYTE, byteArray);
                            }
                            else { // 32
                                dataLength = width * height * 4;
                                byteArray = DDSTools._GetRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, rOffset, gOffset, bOffset, aOffset);
                                engine._uploadDataToTexture(sampler, i, gl.RGBA, width, height, gl.RGBA, gl.UNSIGNED_BYTE, byteArray);
                            }
                        }
                        else if (info.isLuminance) {
                            var unpackAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
                            var unpaddedRowSize = width;
                            var paddedRowSize = Math.floor((width + unpackAlignment - 1) / unpackAlignment) * unpackAlignment;
                            dataLength = paddedRowSize * (height - 1) + unpaddedRowSize;
                            byteArray = DDSTools._GetLuminanceArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
                            engine._uploadDataToTexture(sampler, i, gl.LUMINANCE, width, height, gl.LUMINANCE, gl.UNSIGNED_BYTE, byteArray);
                        }
                        else {
                            dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
                            byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
                            engine._uploadCompressedDataToTexture(sampler, i, internalFormat, width, height, byteArray);
                        }
                    }
                    dataOffset += bpp ? (width * height * (bpp / 8)) : dataLength;
                    width *= 0.5;
                    height *= 0.5;
                    width = Math.max(1.0, width);
                    height = Math.max(1.0, height);
                }
                if (currentFace !== undefined) {
                    // Loading a single face
                    break;
                }
            }
            if (sphericalPolynomialFaces && sphericalPolynomialFaces.length > 0) {
                info.sphericalPolynomial = LIB.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial({
                    size: header[off_width],
                    right: sphericalPolynomialFaces[0],
                    left: sphericalPolynomialFaces[1],
                    up: sphericalPolynomialFaces[2],
                    down: sphericalPolynomialFaces[3],
                    front: sphericalPolynomialFaces[4],
                    back: sphericalPolynomialFaces[5],
                    format: LIB.Engine.TEXTUREFORMAT_RGBA,
                    type: LIB.Engine.TEXTURETYPE_FLOAT,
                    gammaSpace: false,
                });
            }
            else {
                info.sphericalPolynomial = undefined;
            }
        };
        DDSTools.StoreLODInAlphaChannel = false;
        return DDSTools;
    }());
    LIB.DDSTools = DDSTools;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.dds.js.map
//# sourceMappingURL=LIB.dds.js.map
