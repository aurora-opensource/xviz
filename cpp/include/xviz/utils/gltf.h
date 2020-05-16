// ------------------------------------------------------------
// Copyright(c) 2019 Jesse Yurkovich
// Licensed under the MIT License <http://opensource.org/licenses/MIT>.
// See the LICENSE file in the repo root for full license information.
// ------------------------------------------------------------

#ifndef XVIZ_UTILS_GLTF_H_
#define XVIZ_UTILS_GLTF_H_

#pragma once

#include <array>
#include <cstring>
#include <fstream>
#include <istream>
#include <ostream>
#include <stdexcept>
#include <string>
#include <system_error>
#include <unordered_map>
#include <vector>

#include "json.hpp"

#if (defined(__cplusplus) && __cplusplus >= 201703L) || (defined(_MSVC_LANG) && (_MSVC_LANG >= 201703L) && (_MSC_VER >= 1911))
#define FX_GLTF_HAS_CPP_17
#include <string_view>
#endif

namespace fx
{
namespace base64
{
    namespace detail
    {
        // clang-format off
        constexpr std::array<char, 64> EncodeMap =
        {
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
            'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
            'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
            'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
        };

        constexpr std::array<char, 256> DecodeMap =
        {
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
            52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
            -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
            15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
            -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        };
        // clang-format on
    } // namespace detail

    inline std::string Encode(std::vector<uint8_t> const & bytes)
    {
        const std::size_t length = bytes.size();
        if (length == 0)
        {
            return {};
        }

        std::string out{};
        out.reserve(((length * 4 / 3) + 3) & (~3u)); // round up to nearest 4

        uint32_t value = 0;
        int32_t bitCount = -6;
        for (const uint8_t c : bytes)
        {
            value = (value << 8u) + c;
            bitCount += 8;
            while (bitCount >= 0)
            {
                const uint32_t shiftOperand = bitCount;
                out.push_back(detail::EncodeMap.at((value >> shiftOperand) & 0x3fu));
                bitCount -= 6;
            }
        }

        if (bitCount > -6)
        {
            const uint32_t shiftOperand = bitCount + 8;
            out.push_back(detail::EncodeMap.at(((value << 8u) >> shiftOperand) & 0x3fu));
        }

        while (out.size() % 4 != 0)
        {
            out.push_back('=');
        }

        return out;
    }

#if defined(FX_GLTF_HAS_CPP_17)
    inline bool TryDecode(std::string_view in, std::vector<uint8_t> & out)
#else
    inline bool TryDecode(std::string const & in, std::vector<uint8_t> & out)
#endif
    {
        out.clear();

        const std::size_t length = in.length();
        if (length == 0)
        {
            return true;
        }

        if (length % 4 != 0)
        {
            return false;
        }

        out.reserve((length / 4) * 3);

        bool invalid = false;
        uint32_t value = 0;
        int32_t bitCount = -8;
        for (std::size_t i = 0; i < length; i++)
        {
            const uint8_t c = static_cast<uint8_t>(in[i]);
            const char map = detail::DecodeMap.at(c);
            if (map == -1)
            {
                if (c != '=') // Non base64 character
                {
                    invalid = true;
                }
                else
                {
                    // Padding characters not where they should be
                    const std::size_t remaining = length - i - 1;
                    if (remaining > 1 || (remaining == 1 ? in[i + 1] != '=' : false))
                    {
                        invalid = true;
                    }
                }

                break;
            }

            value = (value << 6u) + map;
            bitCount += 6;
            if (bitCount >= 0)
            {
                const uint32_t shiftOperand = bitCount;
                out.push_back(static_cast<uint8_t>(value >> shiftOperand));
                bitCount -= 8;
            }
        }

        if (invalid)
        {
            out.clear();
        }

        return !invalid;
    }
} // namespace base64

namespace gltf
{
    class invalid_gltf_document : public std::runtime_error
    {
    public:
        explicit invalid_gltf_document(char const * message)
            : std::runtime_error(message)
        {
        }

        invalid_gltf_document(char const * message, std::string const & extra)
            : std::runtime_error(CreateMessage(message, extra).c_str())
        {
        }

    private:
        std::string CreateMessage(char const * message, std::string const & extra)
        {
            return std::string(message).append(" : ").append(extra);
        }
    };

    namespace detail
    {
#if defined(FX_GLTF_HAS_CPP_17)
        template <typename TTarget>
        inline void ReadRequiredField(std::string_view key, nlohmann::json const & json, TTarget & target)
#else
        template <typename TKey, typename TTarget>
        inline void ReadRequiredField(TKey && key, nlohmann::json const & json, TTarget & target)
#endif
        {
            const nlohmann::json::const_iterator iter = json.find(key);
            if (iter == json.end())
            {
                throw invalid_gltf_document("Required field not found", std::string(key));
            }

            target = iter->get<TTarget>();
        }

#if defined(FX_GLTF_HAS_CPP_17)
        template <typename TTarget>
        inline void ReadOptionalField(std::string_view key, nlohmann::json const & json, TTarget & target)
#else
        template <typename TKey, typename TTarget>
        inline void ReadOptionalField(TKey && key, nlohmann::json const & json, TTarget & target)
#endif
        {
            const nlohmann::json::const_iterator iter = json.find(key);
            if (iter != json.end())
            {
                target = iter->get<TTarget>();
            }
        }

        inline void ReadExtensionsAndExtras(nlohmann::json const & json, nlohmann::json & extensionsAndExtras)
        {
            const nlohmann::json::const_iterator iterExtensions = json.find("extensions");
            const nlohmann::json::const_iterator iterExtras = json.find("extras");
            if (iterExtensions != json.end())
            {
                extensionsAndExtras["extensions"] = *iterExtensions;
            }

            if (iterExtras != json.end())
            {
                extensionsAndExtras["extras"] = *iterExtras;
            }
        }

        template <typename TValue>
        inline void WriteField(std::string const & key, nlohmann::json & json, TValue const & value)
        {
            if (!value.empty())
            {
                json[key] = value;
            }
        }

        template <typename TValue>
        inline void WriteField(std::string const & key, nlohmann::json & json, TValue const & value, TValue const & defaultValue)
        {
            if (value != defaultValue)
            {
                json[key] = value;
            }
        }

        inline void WriteExtensions(nlohmann::json & json, nlohmann::json const & extensionsAndExtras)
        {
            if (!extensionsAndExtras.empty())
            {
                for (nlohmann::json::const_iterator it = extensionsAndExtras.begin(); it != extensionsAndExtras.end(); ++it)
                {
                    json[it.key()] = it.value();
                }
            }
        }

        inline std::string GetDocumentRootPath(std::string const & documentFilePath)
        {
            const std::size_t pos = documentFilePath.find_last_of("/\\");
            if (pos != std::string::npos)
            {
                return documentFilePath.substr(0, pos);
            }

            return {};
        }

        inline std::string CreateBufferUriPath(std::string const & documentRootPath, std::string const & bufferUri)
        {
            // Prevent simple forms of path traversal from malicious uri references...
            if (bufferUri.empty() || bufferUri.find("..") != std::string::npos || bufferUri.front() == '/' || bufferUri.front() == '\\')
            {
                throw invalid_gltf_document("Invalid buffer.uri value", bufferUri);
            }

            std::string documentRoot = documentRootPath;
            if (documentRoot.length() > 0)
            {
                if (documentRoot.back() != '/')
                {
                    documentRoot.push_back('/');
                }
            }

            return documentRoot + bufferUri;
        }

        struct ChunkHeader
        {
            uint32_t chunkLength{};
            uint32_t chunkType{};
        };

        struct GLBHeader
        {
            uint32_t magic{};
            uint32_t version{};
            uint32_t length{};

            ChunkHeader jsonHeader{};
        };

        constexpr uint32_t DefaultMaxBufferCount = 8;
        constexpr uint32_t DefaultMaxMemoryAllocation = 32 * 1024 * 1024;
        constexpr std::size_t HeaderSize{ sizeof(GLBHeader) };
        constexpr std::size_t ChunkHeaderSize{ sizeof(ChunkHeader) };
        constexpr uint32_t GLBHeaderMagic = 0x46546c67u;
        constexpr uint32_t GLBChunkJSON = 0x4e4f534au;
        constexpr uint32_t GLBChunkBIN = 0x004e4942u;

        constexpr char const * const MimetypeApplicationOctet = "data:application/octet-stream;base64";
        constexpr char const * const MimetypeImagePNG = "data:image/png;base64";
        constexpr char const * const MimetypeImageJPG = "data:image/jpeg;base64";
    } // namespace detail

    namespace defaults
    {
        constexpr std::array<float, 16> IdentityMatrix{ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 };
        constexpr std::array<float, 4> IdentityRotation{ 0, 0, 0, 1 };
        constexpr std::array<float, 4> IdentityVec4{ 1, 1, 1, 1 };
        constexpr std::array<float, 3> IdentityVec3{ 1, 1, 1 };
        constexpr std::array<float, 3> NullVec3{ 0, 0, 0 };
        constexpr float IdentityScalar = 1;
        constexpr float FloatSentinel = 10000;

        constexpr bool AccessorNormalized = false;

        constexpr float MaterialAlphaCutoff = 0.5f;
        constexpr bool MaterialDoubleSided = false;
    } // namespace defaults

    using Attributes = std::unordered_map<std::string, uint32_t>;

    struct NeverEmpty
    {
        bool empty() const noexcept
        {
            return false;
        }
    };

    struct Accessor
    {
        enum class ComponentType : uint16_t
        {
            None = 0,
            Byte = 5120,
            UnsignedByte = 5121,
            Short = 5122,
            UnsignedShort = 5123,
            UnsignedInt = 5125,
            Float = 5126
        };

        enum class Type : uint8_t
        {
            None,
            Scalar,
            Vec2,
            Vec3,
            Vec4,
            Mat2,
            Mat3,
            Mat4
        };

        struct Sparse
        {
            struct Indices : NeverEmpty
            {
                uint32_t bufferView{};
                uint32_t byteOffset{};
                ComponentType componentType{ ComponentType::None };

                nlohmann::json extensionsAndExtras{};
            };

            struct Values : NeverEmpty
            {
                uint32_t bufferView{};
                uint32_t byteOffset{};

                nlohmann::json extensionsAndExtras{};
            };

            int32_t count{};
            Indices indices{};
            Values values{};

            nlohmann::json extensionsAndExtras{};

            bool empty() const noexcept
            {
                return count == 0;
            }
        };

        int32_t bufferView{ -1 };
        uint32_t byteOffset{};
        uint32_t count{};
        bool normalized{ defaults::AccessorNormalized };

        ComponentType componentType{ ComponentType::None };
        Type type{ Type::None };
        Sparse sparse{};

        std::string name;
        std::vector<float> max{};
        std::vector<float> min{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Animation
    {
        struct Channel
        {
            struct Target : NeverEmpty
            {
                int32_t node{ -1 };
                std::string path{};

                nlohmann::json extensionsAndExtras{};
            };

            int32_t sampler{ -1 };
            Target target{};

            nlohmann::json extensionsAndExtras{};
        };

        struct Sampler
        {
            enum class Type
            {
                Linear,
                Step,
                CubicSpline
            };

            int32_t input{ -1 };
            int32_t output{ -1 };

            Type interpolation{ Sampler::Type::Linear };

            nlohmann::json extensionsAndExtras{};
        };

        std::string name{};
        std::vector<Channel> channels{};
        std::vector<Sampler> samplers{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Asset : NeverEmpty
    {
        std::string copyright{};
        std::string generator{};
        std::string minVersion{};
        std::string version{ "2.0" };

        nlohmann::json extensionsAndExtras{};
    };

    struct Buffer
    {
        uint32_t byteLength{};

        std::string name;
        std::string uri;

        nlohmann::json extensionsAndExtras{};

        std::vector<uint8_t> data{};

        bool IsEmbeddedResource() const noexcept
        {
            return uri.find(detail::MimetypeApplicationOctet) == 0;
        }

        void SetEmbeddedResource()
        {
            uri = std::string(detail::MimetypeApplicationOctet).append(",").append(base64::Encode(data));
        }
    };

    struct BufferView
    {
        enum class TargetType : uint16_t
        {
            None = 0,
            ArrayBuffer = 34962,
            ElementArrayBuffer = 34963
        };

        std::string name;

        int32_t buffer{ -1 };
        uint32_t byteOffset{};
        uint32_t byteLength{};
        uint32_t byteStride{};

        TargetType target{ TargetType::None };

        nlohmann::json extensionsAndExtras{};
    };

    struct Camera
    {
        enum class Type
        {
            None,
            Orthographic,
            Perspective
        };

        struct Orthographic : NeverEmpty
        {
            float xmag{ defaults::FloatSentinel };
            float ymag{ defaults::FloatSentinel };
            float zfar{ -defaults::FloatSentinel };
            float znear{ -defaults::FloatSentinel };

            nlohmann::json extensionsAndExtras{};
        };

        struct Perspective : NeverEmpty
        {
            float aspectRatio{};
            float yfov{};
            float zfar{};
            float znear{};

            nlohmann::json extensionsAndExtras{};
        };

        std::string name{};
        Type type{ Type::None };

        Orthographic orthographic;
        Perspective perspective;

        nlohmann::json extensionsAndExtras{};
    };

    struct Image
    {
        int32_t bufferView{};

        std::string name;
        std::string uri;
        std::string mimeType;

        uint32_t width;
        uint32_t height;

        nlohmann::json extensionsAndExtras{};

        bool IsEmbeddedResource() const noexcept
        {
            return uri.find(detail::MimetypeImagePNG) == 0 || uri.find(detail::MimetypeImageJPG) == 0;
        }

        void MaterializeData(std::vector<uint8_t> & data) const
        {
            char const * const mimetype = uri.find(detail::MimetypeImagePNG) == 0 ? detail::MimetypeImagePNG : detail::MimetypeImageJPG;
            const std::size_t startPos = std::char_traits<char>::length(mimetype) + 1;

#if defined(FX_GLTF_HAS_CPP_17)
            const std::size_t base64Length = uri.length() - startPos;
            const bool success = base64::TryDecode({ &uri[startPos], base64Length }, data);
#else
            const bool success = base64::TryDecode(uri.substr(startPos), data);
#endif
            if (!success)
            {
                throw invalid_gltf_document("Invalid buffer.uri value", "malformed base64");
            }
        }
    };

    struct Material
    {
        enum class AlphaMode : uint8_t
        {
            Opaque,
            Mask,
            Blend
        };

        struct Texture
        {
            int32_t index{ -1 };
            int32_t texCoord{};

            nlohmann::json extensionsAndExtras{};

            bool empty() const noexcept
            {
                return index == -1;
            }
        };

        struct NormalTexture : Texture
        {
            float scale{ defaults::IdentityScalar };
        };

        struct OcclusionTexture : Texture
        {
            float strength{ defaults::IdentityScalar };
        };

        struct PBRMetallicRoughness
        {
            std::array<float, 4> baseColorFactor = { defaults::IdentityVec4 };
            Texture baseColorTexture;

            float roughnessFactor{ defaults::IdentityScalar };
            float metallicFactor{ defaults::IdentityScalar };
            Texture metallicRoughnessTexture;

            nlohmann::json extensionsAndExtras{};

            bool empty() const
            {
                return baseColorTexture.empty() && metallicRoughnessTexture.empty() && metallicFactor == 1.0f && roughnessFactor == 1.0f && baseColorFactor == defaults::IdentityVec4;
            }
        };

        float alphaCutoff{ defaults::MaterialAlphaCutoff };
        AlphaMode alphaMode{ AlphaMode::Opaque };

        bool doubleSided{ defaults::MaterialDoubleSided };

        NormalTexture normalTexture;
        OcclusionTexture occlusionTexture;
        PBRMetallicRoughness pbrMetallicRoughness;

        Texture emissiveTexture;
        std::array<float, 3> emissiveFactor = { defaults::NullVec3 };

        std::string name;
        nlohmann::json extensionsAndExtras{};
    };

    struct Primitive
    {
        enum class Mode : uint8_t
        {
            Points = 0,
            Lines = 1,
            LineLoop = 2,
            LineStrip = 3,
            Triangles = 4,
            TriangleStrip = 5,
            TriangleFan = 6
        };

        int32_t indices{ -1 };
        int32_t material{ -1 };

        Mode mode{ Mode::Triangles };

        Attributes attributes{};
        std::vector<Attributes> targets{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Mesh
    {
        std::string name;

        std::vector<float> weights{};
        std::vector<Primitive> primitives{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Node
    {
        std::string name;

        int32_t camera{ -1 };
        int32_t mesh{ -1 };
        int32_t skin{ -1 };

        std::array<float, 16> matrix{ defaults::IdentityMatrix };
        std::array<float, 4> rotation{ defaults::IdentityRotation };
        std::array<float, 3> scale{ defaults::IdentityVec3 };
        std::array<float, 3> translation{ defaults::NullVec3 };

        std::vector<int32_t> children{};
        std::vector<float> weights{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Sampler
    {
        enum class MagFilter : uint16_t
        {
            None,
            Nearest = 9728,
            Linear = 9729
        };

        enum class MinFilter : uint16_t
        {
            None,
            Nearest = 9728,
            Linear = 9729,
            NearestMipMapNearest = 9984,
            LinearMipMapNearest = 9985,
            NearestMipMapLinear = 9986,
            LinearMipMapLinear = 9987
        };

        enum class WrappingMode : uint16_t
        {
            ClampToEdge = 33071,
            MirroredRepeat = 33648,
            Repeat = 10497
        };

        std::string name;

        MagFilter magFilter{ MagFilter::None };
        MinFilter minFilter{ MinFilter::None };

        WrappingMode wrapS{ WrappingMode::Repeat };
        WrappingMode wrapT{ WrappingMode::Repeat };

        nlohmann::json extensionsAndExtras{};

        bool empty() const noexcept
        {
            return name.empty() && magFilter == MagFilter::None && minFilter == MinFilter::None && wrapS == WrappingMode::Repeat && wrapT == WrappingMode::Repeat && extensionsAndExtras.empty();
        }
    };

    struct Scene
    {
        std::string name;

        std::vector<uint32_t> nodes{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Skin
    {
        int32_t inverseBindMatrices{ -1 };
        int32_t skeleton{ -1 };

        std::string name;
        std::vector<uint32_t> joints{};

        nlohmann::json extensionsAndExtras{};
    };

    struct Texture
    {
        std::string name;

        int32_t sampler{ -1 };
        int32_t source{ -1 };

        nlohmann::json extensionsAndExtras{};
    };

    struct Document
    {
        Asset asset;

        std::vector<Accessor> accessors{};
        std::vector<Animation> animations{};
        std::vector<Buffer> buffers{};
        std::vector<BufferView> bufferViews{};
        std::vector<Camera> cameras{};
        std::vector<Image> images{};
        std::vector<Material> materials{};
        std::vector<Mesh> meshes{};
        std::vector<Node> nodes{};
        std::vector<Sampler> samplers{};
        std::vector<Scene> scenes{};
        std::vector<Skin> skins{};
        std::vector<Texture> textures{};

        int32_t scene{ -1 };
        std::vector<std::string> extensionsUsed{};
        std::vector<std::string> extensionsRequired{};

        nlohmann::json extensionsAndExtras{};
    };

    struct ReadQuotas
    {
        uint32_t MaxBufferCount{ detail::DefaultMaxBufferCount };
        uint32_t MaxFileSize{ detail::DefaultMaxMemoryAllocation };
        uint32_t MaxBufferByteLength{ detail::DefaultMaxMemoryAllocation };
    };

    inline void from_json(nlohmann::json const & json, Accessor::Type & accessorType)
    {
        std::string type = json.get<std::string>();
        if (type == "SCALAR")
        {
            accessorType = Accessor::Type::Scalar;
        }
        else if (type == "VEC2")
        {
            accessorType = Accessor::Type::Vec2;
        }
        else if (type == "VEC3")
        {
            accessorType = Accessor::Type::Vec3;
        }
        else if (type == "VEC4")
        {
            accessorType = Accessor::Type::Vec4;
        }
        else if (type == "MAT2")
        {
            accessorType = Accessor::Type::Mat2;
        }
        else if (type == "MAT3")
        {
            accessorType = Accessor::Type::Mat3;
        }
        else if (type == "MAT4")
        {
            accessorType = Accessor::Type::Mat4;
        }
        else
        {
            throw invalid_gltf_document("Unknown accessor.type value", type);
        }
    }

    inline void from_json(nlohmann::json const & json, Accessor::Sparse::Values & values)
    {
        detail::ReadRequiredField("bufferView", json, values.bufferView);

        detail::ReadOptionalField("byteOffset", json, values.byteOffset);

        detail::ReadExtensionsAndExtras(json, values.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Accessor::Sparse::Indices & indices)
    {
        detail::ReadRequiredField("bufferView", json, indices.bufferView);
        detail::ReadRequiredField("componentType", json, indices.componentType);

        detail::ReadOptionalField("byteOffset", json, indices.byteOffset);

        detail::ReadExtensionsAndExtras(json, indices.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Accessor::Sparse & sparse)
    {
        detail::ReadRequiredField("count", json, sparse.count);
        detail::ReadRequiredField("indices", json, sparse.indices);
        detail::ReadRequiredField("values", json, sparse.values);

        detail::ReadExtensionsAndExtras(json, sparse.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Accessor & accessor)
    {
        detail::ReadRequiredField("componentType", json, accessor.componentType);
        detail::ReadRequiredField("count", json, accessor.count);
        detail::ReadRequiredField("type", json, accessor.type);

        detail::ReadOptionalField("bufferView", json, accessor.bufferView);
        detail::ReadOptionalField("byteOffset", json, accessor.byteOffset);
        detail::ReadOptionalField("max", json, accessor.max);
        detail::ReadOptionalField("min", json, accessor.min);
        detail::ReadOptionalField("name", json, accessor.name);
        detail::ReadOptionalField("normalized", json, accessor.normalized);
        detail::ReadOptionalField("sparse", json, accessor.sparse);

        detail::ReadExtensionsAndExtras(json, accessor.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Animation::Channel::Target & animationChannelTarget)
    {
        detail::ReadRequiredField("path", json, animationChannelTarget.path);

        detail::ReadOptionalField("node", json, animationChannelTarget.node);

        detail::ReadExtensionsAndExtras(json, animationChannelTarget.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Animation::Channel & animationChannel)
    {
        detail::ReadRequiredField("sampler", json, animationChannel.sampler);
        detail::ReadRequiredField("target", json, animationChannel.target);

        detail::ReadExtensionsAndExtras(json, animationChannel.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Animation::Sampler::Type & animationSamplerType)
    {
        std::string type = json.get<std::string>();
        if (type == "LINEAR")
        {
            animationSamplerType = Animation::Sampler::Type::Linear;
        }
        else if (type == "STEP")
        {
            animationSamplerType = Animation::Sampler::Type::Step;
        }
        else if (type == "CUBICSPLINE")
        {
            animationSamplerType = Animation::Sampler::Type::CubicSpline;
        }
        else
        {
            throw invalid_gltf_document("Unknown animation.sampler.interpolation value", type);
        }
    }

    inline void from_json(nlohmann::json const & json, Animation::Sampler & animationSampler)
    {
        detail::ReadRequiredField("input", json, animationSampler.input);
        detail::ReadRequiredField("output", json, animationSampler.output);

        detail::ReadOptionalField("interpolation", json, animationSampler.interpolation);

        detail::ReadExtensionsAndExtras(json, animationSampler.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Animation & animation)
    {
        detail::ReadRequiredField("channels", json, animation.channels);
        detail::ReadRequiredField("samplers", json, animation.samplers);

        detail::ReadOptionalField("name", json, animation.name);

        detail::ReadExtensionsAndExtras(json, animation.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Asset & asset)
    {
        detail::ReadRequiredField("version", json, asset.version);
        detail::ReadOptionalField("copyright", json, asset.copyright);
        detail::ReadOptionalField("generator", json, asset.generator);
        detail::ReadOptionalField("minVersion", json, asset.minVersion);

        detail::ReadExtensionsAndExtras(json, asset.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Buffer & buffer)
    {
        detail::ReadRequiredField("byteLength", json, buffer.byteLength);

        detail::ReadOptionalField("name", json, buffer.name);
        detail::ReadOptionalField("uri", json, buffer.uri);

        detail::ReadExtensionsAndExtras(json, buffer.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, BufferView & bufferView)
    {
        detail::ReadRequiredField("buffer", json, bufferView.buffer);
        detail::ReadRequiredField("byteLength", json, bufferView.byteLength);

        detail::ReadOptionalField("byteOffset", json, bufferView.byteOffset);
        detail::ReadOptionalField("byteStride", json, bufferView.byteStride);
        detail::ReadOptionalField("name", json, bufferView.name);
        detail::ReadOptionalField("target", json, bufferView.target);

        detail::ReadExtensionsAndExtras(json, bufferView.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Camera::Type & cameraType)
    {
        std::string type = json.get<std::string>();
        if (type == "orthographic")
        {
            cameraType = Camera::Type::Orthographic;
        }
        else if (type == "perspective")
        {
            cameraType = Camera::Type::Perspective;
        }
        else
        {
            throw invalid_gltf_document("Unknown camera.type value", type);
        }
    }

    inline void from_json(nlohmann::json const & json, Camera::Orthographic & camera)
    {
        detail::ReadRequiredField("xmag", json, camera.xmag);
        detail::ReadRequiredField("ymag", json, camera.ymag);
        detail::ReadRequiredField("zfar", json, camera.zfar);
        detail::ReadRequiredField("znear", json, camera.znear);

        detail::ReadExtensionsAndExtras(json, camera.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Camera::Perspective & camera)
    {
        detail::ReadRequiredField("yfov", json, camera.yfov);
        detail::ReadRequiredField("znear", json, camera.znear);

        detail::ReadOptionalField("aspectRatio", json, camera.aspectRatio);
        detail::ReadOptionalField("zfar", json, camera.zfar);

        detail::ReadExtensionsAndExtras(json, camera.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Camera & camera)
    {
        detail::ReadRequiredField("type", json, camera.type);

        detail::ReadOptionalField("name", json, camera.name);

        detail::ReadExtensionsAndExtras(json, camera.extensionsAndExtras);

        if (camera.type == Camera::Type::Perspective)
        {
            detail::ReadRequiredField("perspective", json, camera.perspective);
        }
        else if (camera.type == Camera::Type::Orthographic)
        {
            detail::ReadRequiredField("orthographic", json, camera.orthographic);
        }
    }

    inline void from_json(nlohmann::json const & json, Image & image)
    {
        detail::ReadOptionalField("bufferView", json, image.bufferView);
        detail::ReadOptionalField("mimeType", json, image.mimeType);
        detail::ReadOptionalField("name", json, image.name);
        detail::ReadOptionalField("width", json, image.width);
        detail::ReadOptionalField("height", json, image.height);
        detail::ReadOptionalField("uri", json, image.uri);

        detail::ReadExtensionsAndExtras(json, image.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Material::AlphaMode & materialAlphaMode)
    {
        std::string alphaMode = json.get<std::string>();
        if (alphaMode == "OPAQUE")
        {
            materialAlphaMode = Material::AlphaMode::Opaque;
        }
        else if (alphaMode == "MASK")
        {
            materialAlphaMode = Material::AlphaMode::Mask;
        }
        else if (alphaMode == "BLEND")
        {
            materialAlphaMode = Material::AlphaMode::Blend;
        }
        else
        {
            throw invalid_gltf_document("Unknown material.alphaMode value", alphaMode);
        }
    }

    inline void from_json(nlohmann::json const & json, Material::Texture & materialTexture)
    {
        detail::ReadRequiredField("index", json, materialTexture.index);
        detail::ReadOptionalField("texCoord", json, materialTexture.texCoord);

        detail::ReadExtensionsAndExtras(json, materialTexture.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Material::NormalTexture & materialTexture)
    {
        from_json(json, static_cast<Material::Texture &>(materialTexture));
        detail::ReadOptionalField("scale", json, materialTexture.scale);

        detail::ReadExtensionsAndExtras(json, materialTexture.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Material::OcclusionTexture & materialTexture)
    {
        from_json(json, static_cast<Material::Texture &>(materialTexture));
        detail::ReadOptionalField("strength", json, materialTexture.strength);

        detail::ReadExtensionsAndExtras(json, materialTexture.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Material::PBRMetallicRoughness & pbrMetallicRoughness)
    {
        detail::ReadOptionalField("baseColorFactor", json, pbrMetallicRoughness.baseColorFactor);
        detail::ReadOptionalField("baseColorTexture", json, pbrMetallicRoughness.baseColorTexture);
        detail::ReadOptionalField("metallicFactor", json, pbrMetallicRoughness.metallicFactor);
        detail::ReadOptionalField("metallicRoughnessTexture", json, pbrMetallicRoughness.metallicRoughnessTexture);
        detail::ReadOptionalField("roughnessFactor", json, pbrMetallicRoughness.roughnessFactor);

        detail::ReadExtensionsAndExtras(json, pbrMetallicRoughness.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Material & material)
    {
        detail::ReadOptionalField("alphaMode", json, material.alphaMode);
        detail::ReadOptionalField("alphaCutoff", json, material.alphaCutoff);
        detail::ReadOptionalField("doubleSided", json, material.doubleSided);
        detail::ReadOptionalField("emissiveFactor", json, material.emissiveFactor);
        detail::ReadOptionalField("emissiveTexture", json, material.emissiveTexture);
        detail::ReadOptionalField("name", json, material.name);
        detail::ReadOptionalField("normalTexture", json, material.normalTexture);
        detail::ReadOptionalField("occlusionTexture", json, material.occlusionTexture);
        detail::ReadOptionalField("pbrMetallicRoughness", json, material.pbrMetallicRoughness);

        detail::ReadExtensionsAndExtras(json, material.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Mesh & mesh)
    {
        detail::ReadRequiredField("primitives", json, mesh.primitives);

        detail::ReadOptionalField("name", json, mesh.name);
        detail::ReadOptionalField("weights", json, mesh.weights);

        detail::ReadExtensionsAndExtras(json, mesh.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Node & node)
    {
        detail::ReadOptionalField("camera", json, node.camera);
        detail::ReadOptionalField("children", json, node.children);
        detail::ReadOptionalField("matrix", json, node.matrix);
        detail::ReadOptionalField("mesh", json, node.mesh);
        detail::ReadOptionalField("name", json, node.name);
        detail::ReadOptionalField("rotation", json, node.rotation);
        detail::ReadOptionalField("scale", json, node.scale);
        detail::ReadOptionalField("skin", json, node.skin);
        detail::ReadOptionalField("translation", json, node.translation);

        detail::ReadExtensionsAndExtras(json, node.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Primitive & primitive)
    {
        detail::ReadRequiredField("attributes", json, primitive.attributes);

        detail::ReadOptionalField("indices", json, primitive.indices);
        detail::ReadOptionalField("material", json, primitive.material);
        detail::ReadOptionalField("mode", json, primitive.mode);
        detail::ReadOptionalField("targets", json, primitive.targets);

        detail::ReadExtensionsAndExtras(json, primitive.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Sampler & sampler)
    {
        detail::ReadOptionalField("magFilter", json, sampler.magFilter);
        detail::ReadOptionalField("minFilter", json, sampler.minFilter);
        detail::ReadOptionalField("name", json, sampler.name);
        detail::ReadOptionalField("wrapS", json, sampler.wrapS);
        detail::ReadOptionalField("wrapT", json, sampler.wrapT);

        detail::ReadExtensionsAndExtras(json, sampler.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Scene & scene)
    {
        detail::ReadOptionalField("name", json, scene.name);
        detail::ReadOptionalField("nodes", json, scene.nodes);

        detail::ReadExtensionsAndExtras(json, scene.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Skin & skin)
    {
        detail::ReadRequiredField("joints", json, skin.joints);

        detail::ReadOptionalField("inverseBindMatrices", json, skin.inverseBindMatrices);
        detail::ReadOptionalField("name", json, skin.name);
        detail::ReadOptionalField("skeleton", json, skin.skeleton);

        detail::ReadExtensionsAndExtras(json, skin.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Texture & texture)
    {
        detail::ReadOptionalField("name", json, texture.name);
        detail::ReadOptionalField("sampler", json, texture.sampler);
        detail::ReadOptionalField("source", json, texture.source);

        detail::ReadExtensionsAndExtras(json, texture.extensionsAndExtras);
    }

    inline void from_json(nlohmann::json const & json, Document & document)
    {
        detail::ReadRequiredField("asset", json, document.asset);

        detail::ReadOptionalField("accessors", json, document.accessors);
        detail::ReadOptionalField("animations", json, document.animations);
        detail::ReadOptionalField("buffers", json, document.buffers);
        detail::ReadOptionalField("bufferViews", json, document.bufferViews);
        detail::ReadOptionalField("cameras", json, document.cameras);
        detail::ReadOptionalField("materials", json, document.materials);
        detail::ReadOptionalField("meshes", json, document.meshes);
        detail::ReadOptionalField("nodes", json, document.nodes);
        detail::ReadOptionalField("images", json, document.images);
        detail::ReadOptionalField("samplers", json, document.samplers);
        detail::ReadOptionalField("scene", json, document.scene);
        detail::ReadOptionalField("scenes", json, document.scenes);
        detail::ReadOptionalField("skins", json, document.skins);
        detail::ReadOptionalField("textures", json, document.textures);

        detail::ReadOptionalField("extensionsUsed", json, document.extensionsUsed);
        detail::ReadOptionalField("extensionsRequired", json, document.extensionsRequired);
        detail::ReadExtensionsAndExtras(json, document.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Accessor::ComponentType const & accessorComponentType)
    {
        if (accessorComponentType == Accessor::ComponentType::None)
        {
            throw invalid_gltf_document("Unknown accessor.componentType value");
        }

        json = static_cast<uint16_t>(accessorComponentType);
    }

    inline void to_json(nlohmann::json & json, Accessor::Type const & accessorType)
    {
        switch (accessorType)
        {
        case Accessor::Type::Scalar:
            json = "SCALAR";
            break;
        case Accessor::Type::Vec2:
            json = "VEC2";
            break;
        case Accessor::Type::Vec3:
            json = "VEC3";
            break;
        case Accessor::Type::Vec4:
            json = "VEC4";
            break;
        case Accessor::Type::Mat2:
            json = "MAT2";
            break;
        case Accessor::Type::Mat3:
            json = "MAT3";
            break;
        case Accessor::Type::Mat4:
            json = "MAT4";
            break;
        default:
            throw invalid_gltf_document("Unknown accessor.type value");
        }
    }

    inline void to_json(nlohmann::json & json, Accessor::Sparse::Values const & values)
    {
        detail::WriteField("bufferView", json, values.bufferView, static_cast<uint32_t>(-1));
        detail::WriteField("byteOffset", json, values.byteOffset, {});
        detail::WriteExtensions(json, values.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Accessor::Sparse::Indices const & indices)
    {
        detail::WriteField("componentType", json, indices.componentType, Accessor::ComponentType::None);
        detail::WriteField("bufferView", json, indices.bufferView, static_cast<uint32_t>(-1));
        detail::WriteField("byteOffset", json, indices.byteOffset, {});
        detail::WriteExtensions(json, indices.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Accessor::Sparse const & sparse)
    {
        detail::WriteField("count", json, sparse.count, -1);
        detail::WriteField("indices", json, sparse.indices);
        detail::WriteField("values", json, sparse.values);
        detail::WriteExtensions(json, sparse.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Accessor const & accessor)
    {
        detail::WriteField("bufferView", json, accessor.bufferView, -1);
        detail::WriteField("byteOffset", json, accessor.byteOffset, {});
        detail::WriteField("componentType", json, accessor.componentType, Accessor::ComponentType::None);
        detail::WriteField("count", json, accessor.count, {});
        detail::WriteField("max", json, accessor.max);
        detail::WriteField("min", json, accessor.min);
        detail::WriteField("name", json, accessor.name);
        detail::WriteField("normalized", json, accessor.normalized, false);
        detail::WriteField("sparse", json, accessor.sparse);
        detail::WriteField("type", json, accessor.type, Accessor::Type::None);
        detail::WriteExtensions(json, accessor.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Animation::Channel::Target const & animationChannelTarget)
    {
        detail::WriteField("node", json, animationChannelTarget.node, -1);
        detail::WriteField("path", json, animationChannelTarget.path);
        detail::WriteExtensions(json, animationChannelTarget.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Animation::Channel const & animationChannel)
    {
        detail::WriteField("sampler", json, animationChannel.sampler, -1);
        detail::WriteField("target", json, animationChannel.target);
        detail::WriteExtensions(json, animationChannel.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Animation::Sampler::Type const & animationSamplerType)
    {
        switch (animationSamplerType)
        {
        case Animation::Sampler::Type::Linear:
            json = "LINEAR";
            break;
        case Animation::Sampler::Type::Step:
            json = "STEP";
            break;
        case Animation::Sampler::Type::CubicSpline:
            json = "CUBICSPLINE";
            break;
        }
    }

    inline void to_json(nlohmann::json & json, Animation::Sampler const & animationSampler)
    {
        detail::WriteField("input", json, animationSampler.input, -1);
        detail::WriteField("interpolation", json, animationSampler.interpolation, Animation::Sampler::Type::Linear);
        detail::WriteField("output", json, animationSampler.output, -1);
        detail::WriteExtensions(json, animationSampler.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Animation const & animation)
    {
        detail::WriteField("channels", json, animation.channels);
        detail::WriteField("name", json, animation.name);
        detail::WriteField("samplers", json, animation.samplers);
        detail::WriteExtensions(json, animation.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Asset const & asset)
    {
        detail::WriteField("copyright", json, asset.copyright);
        detail::WriteField("generator", json, asset.generator);
        detail::WriteField("minVersion", json, asset.minVersion);
        detail::WriteField("version", json, asset.version);
        detail::WriteExtensions(json, asset.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Buffer const & buffer)
    {
        detail::WriteField("byteLength", json, buffer.byteLength, {});
        detail::WriteField("name", json, buffer.name);
        detail::WriteField("uri", json, buffer.uri);
        detail::WriteExtensions(json, buffer.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, BufferView const & bufferView)
    {
        detail::WriteField("buffer", json, bufferView.buffer, -1);
        detail::WriteField("byteLength", json, bufferView.byteLength, {});
        detail::WriteField("byteOffset", json, bufferView.byteOffset, {});
        detail::WriteField("byteStride", json, bufferView.byteStride, {});
        detail::WriteField("name", json, bufferView.name);
        detail::WriteField("target", json, bufferView.target, BufferView::TargetType::None);
        detail::WriteExtensions(json, bufferView.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Camera::Type const & cameraType)
    {
        switch (cameraType)
        {
        case Camera::Type::Orthographic:
            json = "orthographic";
            break;
        case Camera::Type::Perspective:
            json = "perspective";
            break;
        default:
            throw invalid_gltf_document("Unknown camera.type value");
        }
    }

    inline void to_json(nlohmann::json & json, Camera::Orthographic const & camera)
    {
        detail::WriteField("xmag", json, camera.xmag, defaults::FloatSentinel);
        detail::WriteField("ymag", json, camera.ymag, defaults::FloatSentinel);
        detail::WriteField("zfar", json, camera.zfar, -defaults::FloatSentinel);
        detail::WriteField("znear", json, camera.znear, -defaults::FloatSentinel);
        detail::WriteExtensions(json, camera.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Camera::Perspective const & camera)
    {
        detail::WriteField("aspectRatio", json, camera.aspectRatio, {});
        detail::WriteField("yfov", json, camera.yfov, {});
        detail::WriteField("zfar", json, camera.zfar, {});
        detail::WriteField("znear", json, camera.znear, {});
        detail::WriteExtensions(json, camera.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Camera const & camera)
    {
        detail::WriteField("name", json, camera.name);
        detail::WriteField("type", json, camera.type, Camera::Type::None);
        detail::WriteExtensions(json, camera.extensionsAndExtras);

        if (camera.type == Camera::Type::Perspective)
        {
            detail::WriteField("perspective", json, camera.perspective);
        }
        else if (camera.type == Camera::Type::Orthographic)
        {
            detail::WriteField("orthographic", json, camera.orthographic);
        }
    }

    inline void to_json(nlohmann::json & json, Image const & image)
    {
        detail::WriteField("bufferView", json, image.bufferView, image.uri.empty() ? -1 : 0); // bufferView or uri need to be written; even if default 0
        detail::WriteField("mimeType", json, image.mimeType);
        detail::WriteField("name", json, image.name);
        detail::WriteField("width", json, image.width, 0u);
        detail::WriteField("height", json, image.height, 0u);
        detail::WriteField("uri", json, image.uri);
        detail::WriteExtensions(json, image.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Material::AlphaMode const & materialAlphaMode)
    {
        switch (materialAlphaMode)
        {
        case Material::AlphaMode::Opaque:
            json = "OPAQUE";
            break;
        case Material::AlphaMode::Mask:
            json = "MASK";
            break;
        case Material::AlphaMode::Blend:
            json = "BLEND";
            break;
        }
    }

    inline void to_json(nlohmann::json & json, Material::Texture const & materialTexture)
    {
        detail::WriteField("index", json, materialTexture.index, -1);
        detail::WriteField("texCoord", json, materialTexture.texCoord, 0);
        detail::WriteExtensions(json, materialTexture.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Material::NormalTexture const & materialTexture)
    {
        to_json(json, static_cast<Material::Texture const &>(materialTexture));
        detail::WriteField("scale", json, materialTexture.scale, defaults::IdentityScalar);
        detail::WriteExtensions(json, materialTexture.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Material::OcclusionTexture const & materialTexture)
    {
        to_json(json, static_cast<Material::Texture const &>(materialTexture));
        detail::WriteField("strength", json, materialTexture.strength, defaults::IdentityScalar);
        detail::WriteExtensions(json, materialTexture.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Material::PBRMetallicRoughness const & pbrMetallicRoughness)
    {
        detail::WriteField("baseColorFactor", json, pbrMetallicRoughness.baseColorFactor, defaults::IdentityVec4);
        detail::WriteField("baseColorTexture", json, pbrMetallicRoughness.baseColorTexture);
        detail::WriteField("metallicFactor", json, pbrMetallicRoughness.metallicFactor, defaults::IdentityScalar);
        detail::WriteField("metallicRoughnessTexture", json, pbrMetallicRoughness.metallicRoughnessTexture);
        detail::WriteField("roughnessFactor", json, pbrMetallicRoughness.roughnessFactor, defaults::IdentityScalar);
        detail::WriteExtensions(json, pbrMetallicRoughness.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Material const & material)
    {
        detail::WriteField("alphaCutoff", json, material.alphaCutoff, defaults::MaterialAlphaCutoff);
        detail::WriteField("alphaMode", json, material.alphaMode, Material::AlphaMode::Opaque);
        detail::WriteField("doubleSided", json, material.doubleSided, defaults::MaterialDoubleSided);
        detail::WriteField("emissiveTexture", json, material.emissiveTexture);
        detail::WriteField("emissiveFactor", json, material.emissiveFactor, defaults::NullVec3);
        detail::WriteField("name", json, material.name);
        detail::WriteField("normalTexture", json, material.normalTexture);
        detail::WriteField("occlusionTexture", json, material.occlusionTexture);
        detail::WriteField("pbrMetallicRoughness", json, material.pbrMetallicRoughness);

        detail::WriteExtensions(json, material.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Mesh const & mesh)
    {
        detail::WriteField("name", json, mesh.name);
        detail::WriteField("primitives", json, mesh.primitives);
        detail::WriteField("weights", json, mesh.weights);
        detail::WriteExtensions(json, mesh.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Node const & node)
    {
        detail::WriteField("camera", json, node.camera, -1);
        detail::WriteField("children", json, node.children);
        detail::WriteField("matrix", json, node.matrix, defaults::IdentityMatrix);
        detail::WriteField("mesh", json, node.mesh, -1);
        detail::WriteField("name", json, node.name);
        detail::WriteField("rotation", json, node.rotation, defaults::IdentityRotation);
        detail::WriteField("scale", json, node.scale, defaults::IdentityVec3);
        detail::WriteField("skin", json, node.skin, -1);
        detail::WriteField("translation", json, node.translation, defaults::NullVec3);
        detail::WriteField("weights", json, node.weights);
        detail::WriteExtensions(json, node.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Primitive const & primitive)
    {
        detail::WriteField("attributes", json, primitive.attributes);
        detail::WriteField("indices", json, primitive.indices, -1);
        detail::WriteField("material", json, primitive.material, -1);
        detail::WriteField("mode", json, primitive.mode, Primitive::Mode::Triangles);
        detail::WriteField("targets", json, primitive.targets);
        detail::WriteExtensions(json, primitive.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Sampler const & sampler)
    {
        if (!sampler.empty())
        {
            detail::WriteField("name", json, sampler.name);
            detail::WriteField("magFilter", json, sampler.magFilter, Sampler::MagFilter::None);
            detail::WriteField("minFilter", json, sampler.minFilter, Sampler::MinFilter::None);
            detail::WriteField("wrapS", json, sampler.wrapS, Sampler::WrappingMode::Repeat);
            detail::WriteField("wrapT", json, sampler.wrapT, Sampler::WrappingMode::Repeat);
            detail::WriteExtensions(json, sampler.extensionsAndExtras);
        }
        else
        {
            // If a sampler is completely empty we still need to write out an empty object for the encompassing array...
            json = nlohmann::json::object();
        }
    }

    inline void to_json(nlohmann::json & json, Scene const & scene)
    {
        detail::WriteField("name", json, scene.name);
        detail::WriteField("nodes", json, scene.nodes);
        detail::WriteExtensions(json, scene.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Skin const & skin)
    {
        detail::WriteField("inverseBindMatrices", json, skin.inverseBindMatrices, -1);
        detail::WriteField("name", json, skin.name);
        detail::WriteField("skeleton", json, skin.skeleton, -1);
        detail::WriteField("joints", json, skin.joints);
        detail::WriteExtensions(json, skin.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Texture const & texture)
    {
        detail::WriteField("name", json, texture.name);
        detail::WriteField("sampler", json, texture.sampler, -1);
        detail::WriteField("source", json, texture.source, -1);
        detail::WriteExtensions(json, texture.extensionsAndExtras);
    }

    inline void to_json(nlohmann::json & json, Document const & document)
    {
        detail::WriteField("accessors", json, document.accessors);
        detail::WriteField("animations", json, document.animations);
        detail::WriteField("asset", json, document.asset);
        detail::WriteField("buffers", json, document.buffers);
        detail::WriteField("bufferViews", json, document.bufferViews);
        detail::WriteField("cameras", json, document.cameras);
        detail::WriteField("images", json, document.images);
        detail::WriteField("materials", json, document.materials);
        detail::WriteField("meshes", json, document.meshes);
        detail::WriteField("nodes", json, document.nodes);
        detail::WriteField("samplers", json, document.samplers);
        detail::WriteField("scene", json, document.scene, -1);
        detail::WriteField("scenes", json, document.scenes);
        detail::WriteField("skins", json, document.skins);
        detail::WriteField("textures", json, document.textures);

        detail::WriteField("extensionsUsed", json, document.extensionsUsed);
        detail::WriteField("extensionsRequired", json, document.extensionsRequired);
        detail::WriteExtensions(json, document.extensionsAndExtras);
    }

    namespace detail
    {
        struct DataContext
        {
            std::string bufferRootPath{};
            ReadQuotas readQuotas;

            std::vector<uint8_t> * binaryData{};
        };

        inline void ThrowIfBad(std::ios const & io)
        {
            if (!io.good())
            {
                throw std::system_error(std::make_error_code(std::errc::io_error));
            }
        }

        inline void MaterializeData(Buffer & buffer)
        {
            const std::size_t startPos = std::char_traits<char>::length(detail::MimetypeApplicationOctet) + 1;
            const std::size_t base64Length = buffer.uri.length() - startPos;
            const std::size_t decodedEstimate = base64Length / 4 * 3;
            if ((decodedEstimate - 2) > buffer.byteLength) // we need to give room for padding...
            {
                throw invalid_gltf_document("Invalid buffer.uri value", "malformed base64");
            }

#if defined(FX_GLTF_HAS_CPP_17)
            const bool success = base64::TryDecode({ &buffer.uri[startPos], base64Length }, buffer.data);
#else
            const bool success = base64::TryDecode(buffer.uri.substr(startPos), buffer.data);
#endif
            if (!success)
            {
                throw invalid_gltf_document("Invalid buffer.uri value", "malformed base64");
            }
        }

        inline Document Create(nlohmann::json const & json, DataContext const & dataContext)
        {
            Document document = json;

            if (document.buffers.size() > dataContext.readQuotas.MaxBufferCount)
            {
                throw invalid_gltf_document("Quota exceeded : number of buffers > MaxBufferCount");
            }

            for (auto & buffer : document.buffers)
            {
                if (buffer.byteLength == 0)
                {
                    throw invalid_gltf_document("Invalid buffer.byteLength value : 0");
                }

                if (buffer.byteLength > dataContext.readQuotas.MaxBufferByteLength)
                {
                    throw invalid_gltf_document("Quota exceeded : buffer.byteLength > MaxBufferByteLength");
                }

                if (!buffer.uri.empty())
                {
                    if (buffer.IsEmbeddedResource())
                    {
                        detail::MaterializeData(buffer);
                    }
                    else
                    {
                        std::ifstream fileData(detail::CreateBufferUriPath(dataContext.bufferRootPath, buffer.uri), std::ios::binary);
                        if (!fileData.good())
                        {
                            throw invalid_gltf_document("Invalid buffer.uri value", buffer.uri);
                        }

                        buffer.data.resize(buffer.byteLength);
                        fileData.read(reinterpret_cast<char *>(&buffer.data[0]), buffer.byteLength);
                    }
                }
                else if (dataContext.binaryData != nullptr)
                {
                    std::vector<uint8_t> & binary = *dataContext.binaryData;
                    if (binary.size() < buffer.byteLength)
                    {
                        throw invalid_gltf_document("Invalid GLB buffer data");
                    }

                    buffer.data.resize(buffer.byteLength);
                    std::memcpy(&buffer.data[0], &binary[0], buffer.byteLength);
                }
            }

            return document;
        }

        inline void ValidateBuffers(Document const & document, bool useBinaryFormat)
        {
            if (document.buffers.empty())
            {
                throw invalid_gltf_document("Invalid glTF document. A document must have at least 1 buffer.");
            }

            bool foundBinaryBuffer = false;
            for (std::size_t bufferIndex = 0; bufferIndex < document.buffers.size(); bufferIndex++)
            {
                Buffer const & buffer = document.buffers[bufferIndex];
                if (buffer.byteLength == 0)
                {
                    throw invalid_gltf_document("Invalid buffer.byteLength value : 0");
                }

                if (buffer.byteLength != buffer.data.size())
                {
                    throw invalid_gltf_document("Invalid buffer.byteLength value : does not match buffer.data size");
                }

                if (buffer.uri.empty())
                {
                    foundBinaryBuffer = true;
                    if (bufferIndex != 0)
                    {
                        throw invalid_gltf_document("Invalid glTF document. Only 1 buffer, the very first, is allowed to have an empty buffer.uri field.");
                    }
                }
            }

            if (useBinaryFormat && !foundBinaryBuffer)
            {
                throw invalid_gltf_document("Invalid glTF document. No buffer found which can meet the criteria for saving to a .glb file.");
            }
        }

        inline void Save(Document const & document, std::ostream & output, std::string const & documentRootPath, bool useBinaryFormat, std::string const & xviz_str)
        {
            // There is no way to check if an ostream has been opened in binary mode or not. Just checking
            // if it's "good" is the best we can do from here...
            detail::ThrowIfBad(output);

            nlohmann::json json = document;

            std::size_t externalBufferIndex = 0;
            if (useBinaryFormat)
            {
                detail::GLBHeader header{ detail::GLBHeaderMagic, 2, 0, { 0, detail::GLBChunkJSON } };
                detail::ChunkHeader binHeader{ 0, detail::GLBChunkBIN };

                std::string jsonText = json.dump();
                jsonText.pop_back(); // remove last }
                jsonText += xviz_str;

                Buffer const & binBuffer = document.buffers.front();
                const uint32_t binPaddedLength = ((binBuffer.byteLength + 3) & (~3u));
                const uint32_t binPadding = binPaddedLength - binBuffer.byteLength;
                binHeader.chunkLength = binPaddedLength;

                header.jsonHeader.chunkLength = ((jsonText.length() + 3) & (~3u));
                const uint32_t headerPadding = static_cast<uint32_t>(header.jsonHeader.chunkLength - jsonText.length());
                header.length = detail::HeaderSize + header.jsonHeader.chunkLength + detail::ChunkHeaderSize + binHeader.chunkLength;

                const char spaces[3] = { ' ', ' ', ' ' };
                const char nulls[3] = { 0, 0, 0 };

                output.write(reinterpret_cast<char *>(&header), detail::HeaderSize);
                output.write(jsonText.c_str(), jsonText.length());
                output.write(&spaces[0], headerPadding);
                output.write(reinterpret_cast<char *>(&binHeader), detail::ChunkHeaderSize);
                output.write(reinterpret_cast<char const *>(&binBuffer.data[0]), binBuffer.byteLength);
                output.write(&nulls[0], binPadding);

                externalBufferIndex = 1;
            }
            else
            {
                output << json.dump(2);
            }

            // The glTF 2.0 spec allows a document to have more than 1 buffer. However, only the first one will be included in the .glb
            // All others must be considered as External/Embedded resources. Process them if necessary...
            for (; externalBufferIndex < document.buffers.size(); externalBufferIndex++)
            {
                Buffer const & buffer = document.buffers[externalBufferIndex];
                if (!buffer.IsEmbeddedResource())
                {
                    std::ofstream fileData(detail::CreateBufferUriPath(documentRootPath, buffer.uri), std::ios::binary);
                    if (!fileData.good())
                    {
                        throw invalid_gltf_document("Invalid buffer.uri value", buffer.uri);
                    }

                    fileData.write(reinterpret_cast<char const *>(&buffer.data[0]), buffer.byteLength);
                }
            }
        }
    } // namespace detail

    inline Document LoadFromText(std::istream & input, std::string const & documentRootPath, ReadQuotas const & readQuotas = {})
    {
        try
        {
            detail::ThrowIfBad(input);

            nlohmann::json json;
            input >> json;

            return detail::Create(json, { documentRootPath, readQuotas });
        }
        catch (invalid_gltf_document &)
        {
            throw;
        }
        catch (std::system_error &)
        {
            throw;
        }
        catch (...)
        {
            std::throw_with_nested(invalid_gltf_document("Invalid glTF document. See nested exception for details."));
        }
    }

    inline Document LoadFromText(std::string const & documentFilePath, ReadQuotas const & readQuotas = {})
    {
        std::ifstream input(documentFilePath);
        if (!input.is_open())
        {
            throw std::system_error(std::make_error_code(std::errc::no_such_file_or_directory));
        }

        return LoadFromText(input, detail::GetDocumentRootPath(documentFilePath), readQuotas);
    }

    inline Document LoadFromBinary(std::istream & input, std::string const & documentRootPath, ReadQuotas const & readQuotas = {})
    {
        try
        {
            detail::GLBHeader header{};
            detail::ThrowIfBad(input.read(reinterpret_cast<char *>(&header), detail::HeaderSize));
            if (header.magic != detail::GLBHeaderMagic ||
                header.jsonHeader.chunkType != detail::GLBChunkJSON ||
                header.jsonHeader.chunkLength + detail::HeaderSize > header.length)
            {
                throw invalid_gltf_document("Invalid GLB header");
            }

            std::vector<uint8_t> json{};
            json.resize(header.jsonHeader.chunkLength);
            detail::ThrowIfBad(input.read(reinterpret_cast<char *>(&json[0]), header.jsonHeader.chunkLength));

            std::size_t totalSize = detail::HeaderSize + header.jsonHeader.chunkLength;
            if (totalSize > readQuotas.MaxFileSize)
            {
                throw invalid_gltf_document("Quota exceeded : file size > MaxFileSize");
            }

            detail::ChunkHeader binHeader{};
            detail::ThrowIfBad(input.read(reinterpret_cast<char *>(&binHeader), detail::ChunkHeaderSize));
            if (binHeader.chunkType != detail::GLBChunkBIN)
            {
                throw invalid_gltf_document("Invalid GLB header");
            }

            totalSize += detail::ChunkHeaderSize + binHeader.chunkLength;
            if (totalSize > readQuotas.MaxFileSize)
            {
                throw invalid_gltf_document("Quota exceeded : file size > MaxFileSize");
            }

            std::vector<uint8_t> binary{};
            binary.resize(binHeader.chunkLength);
            detail::ThrowIfBad(input.read(reinterpret_cast<char *>(&binary[0]), binHeader.chunkLength));

            return detail::Create(
                nlohmann::json::parse({ &json[0], header.jsonHeader.chunkLength }),
                { documentRootPath, readQuotas, &binary });
        }
        catch (invalid_gltf_document &)
        {
            throw;
        }
        catch (std::system_error &)
        {
            throw;
        }
        catch (...)
        {
            std::throw_with_nested(invalid_gltf_document("Invalid glTF document. See nested exception for details."));
        }
    }

    inline Document LoadFromBinary(std::string const & documentFilePath, ReadQuotas const & readQuotas = {})
    {
        std::ifstream input(documentFilePath, std::ios::binary);
        if (!input.is_open())
        {
            throw std::system_error(std::make_error_code(std::errc::no_such_file_or_directory));
        }

        return LoadFromBinary(input, detail::GetDocumentRootPath(documentFilePath), readQuotas);
    }

    inline void Save(Document const & document, std::ostream & output, std::string const & documentRootPath, bool useBinaryFormat, std::string const & xviz_str)
    {
        try
        {
            detail::ValidateBuffers(document, useBinaryFormat);

            detail::Save(document, output, documentRootPath, useBinaryFormat, xviz_str);
        }
        catch (invalid_gltf_document &)
        {
            throw;
        }
        catch (std::system_error &)
        {
            throw;
        }
        catch (...)
        {
            std::throw_with_nested(invalid_gltf_document("Invalid glTF document. See nested exception for details."));
        }
    }

    inline void Save(Document const & document, std::string const & documentFilePath, bool useBinaryFormat)
    {
        std::ofstream output(documentFilePath, useBinaryFormat ? std::ios::binary : std::ios::out);
        Save(document, output, detail::GetDocumentRootPath(documentFilePath), useBinaryFormat, "");
    }
} // namespace gltf

// A general-purpose utility to format an exception hierarchy into a string for output
inline void FormatException(std::string & output, std::exception const & ex, int level = 0)
{
    output.append(std::string(level, ' ')).append(ex.what());
    try
    {
        std::rethrow_if_nested(ex);
    }
    catch (std::exception const & e)
    {
        FormatException(output.append("\n"), e, level + 2);
    }
}

} // namespace fx

#undef FX_GLTF_HAS_CPP_17

#endif