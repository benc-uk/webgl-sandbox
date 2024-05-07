define("bithero/glsl", ["require"],(require)=>{
var moduleExports = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/fillers/monaco-editor-amd.ts
  var require_monaco_editor_amd = __commonJS({
    "src/fillers/monaco-editor-amd.ts"(exports, module) {
      var api = __toESM(__require("vs/editor/editor.api"));
      module.exports = api;
    }
  });

  // src/glsl.ts
  var import_monaco_editor = __toESM(require_monaco_editor_amd());
  var langId = "glsl";
  import_monaco_editor.languages.register({
    id: langId,
    extensions: [".frag", ".vert"]
  });
  import_monaco_editor.languages.setLanguageConfiguration(langId, {
    comments: {
      lineComment: "//",
      blockComment: ["/*", "*/"]
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"]
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"', notIn: ["string"] },
      { open: "'", close: "'", notIn: ["string"] }
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });
  import_monaco_editor.languages.setMonarchTokensProvider(langId, {
    tokenPostfix: ".glsl",
    defaultToken: "invalid",
    // preprocessor directives
    directives: [
      "#",
      "#define",
      "#undef",
      "#if",
      "#ifdef",
      "#ifndef",
      "#else",
      "#elif",
      "#endif",
      "#error",
      "#pragma",
      "#extension",
      "#version",
      "#line"
    ],
    // preprocessor macros
    macros: [
      "__LINE__",
      "__FILE__",
      "__VERSION__"
    ],
    // storage modifiers
    storage: [
      "in",
      "out",
      "uniform",
      "layout",
      "attribute",
      "varying",
      "precision",
      "highp",
      "mediump",
      "lowp"
    ],
    types: [
      "void",
      "bool",
      "int",
      "uint",
      "float",
      "double",
      "vec2",
      "vec3",
      "vec4",
      "ivec2",
      "ivec3",
      "ivec4",
      "bvec2",
      "bvec3",
      "bvec4",
      "uvec2",
      "uvec3",
      "uvec4",
      "dvec2",
      "dvec3",
      "dvec4",
      "mat2",
      "mat3",
      "mat4",
      "mat2x2",
      "mat2x3",
      "mat2x4",
      "mat3x2",
      "mat3x3",
      "mat3x4",
      "mat4x2",
      "mat4x3",
      "mat4x4",
      "dmat2",
      "dmat3",
      "dmat4",
      "dmat2x2",
      "dmat2x3",
      "dmat2x4",
      "dmat3x2",
      "dmat3x3",
      "dmat3x4",
      "dmat4x2",
      "dmat4x3",
      "dmat4x4",
      "sampler1D",
      "texture1D",
      "image1D",
      "sampler1DShadow",
      "sampler1DArray",
      "texture1DArray",
      "image1DArray",
      "sampler1DArrayShadow",
      "sampler2D",
      "texture2D",
      "image2D",
      "sampler2DShadow",
      "sampler2DArray",
      "texture2DArray",
      "image2DArray",
      "sampler2DArrayShadow",
      "sampler2DMS",
      "texture2DMS",
      "image2DMS",
      "sampler2DMSArray",
      "texture2DMSArray",
      "image2DMSArray",
      "sampler2DRect",
      "texture2DRect",
      "image2DRect",
      "sampler2DRectShadow",
      "sampler3D",
      "texture3D",
      "image3D",
      "samplerCube",
      "textureCube",
      "imageCube",
      "samplerCubeShadow",
      "samplerCubeArray",
      "textureCubeArray",
      "imageCubeArray",
      "samplerCubeArrayShadow",
      "samplerBuffer",
      "textureBuffer",
      "imageBuffer",
      "subpassInput",
      "subpassInputMS",
      "isampler1D",
      "itexture1D",
      "iimage1D",
      "isampler1DArray",
      "itexture1DArray",
      "iimage1DArray",
      "isampler2D",
      "itexture2D",
      "iimage2D",
      "isampler2DArray",
      "itexture2DArray",
      "iimage2DArray",
      "isampler2DMS",
      "itexture2DMS",
      "iimage2DMS",
      "isampler2DMSArray",
      "itexture2DMSArray",
      "iimage2DMSArray",
      "isampler2DRect",
      "itexture2DRect",
      "iimage2DRect",
      "isampler3D",
      "itexture3D",
      "iimage3D",
      "isamplerCube",
      "itextureCube",
      "iimageCube",
      "isamplerCubeArray",
      "itextureCubeArray",
      "iimageCubeArray",
      "isamplerBuffer",
      "itextureBuffer",
      "iimageBuffer",
      "isubpassInput",
      "isubpassInputMS",
      "usampler1D",
      "utexture1D",
      "uimage1D",
      "usampler1DArray",
      "utexture1DArray",
      "uimage1DArray",
      "usampler2D",
      "utexture2D",
      "uimage2D",
      "usampler2DArray",
      "utexture2DArray",
      "uimage2DArray",
      "usampler2DMS",
      "utexture2DMS",
      "uimage2DMS",
      "usampler2DMSArray",
      "utexture2DMSArray",
      "uimage2DMSArray",
      "usampler2DRect",
      "utexture2DRect",
      "uimage2DRect",
      "usampler3D",
      "utexture3D",
      "uimage3D",
      "usamplerCube",
      "utextureCube",
      "uimageCube",
      "usamplerCubeArray",
      "utextureCubeArray",
      "uimageCubeArray",
      "usamplerBuffer",
      "utextureBuffer",
      "uimageBuffer",
      "atomic_uint",
      "usubpassInput",
      "usubpassInputMS",
      "sampler",
      "samplerShadow"
    ],
    operators: [
      "*",
      "+",
      "-",
      "/",
      "~",
      "!",
      "%",
      "<<",
      ">>",
      "<",
      ">",
      "<=",
      ">=",
      "==",
      "!=",
      "&",
      "^",
      "|",
      "&&",
      "^^",
      "||",
      // selection ?:
      "=",
      "+=",
      "-=",
      "*=",
      "/=",
      "%=",
      "<<=",
      ">>=",
      "&=",
      "^=",
      "|="
    ],
    builtin_vars: [
      // language variables
      "gl_VertexID",
      "gl_InstanceID",
      // non-vulkan
      "gl_VertexIndex",
      "gl_InstanceIndex",
      // vulkan
      "gl_DrawID",
      "gl_BaseVertex",
      "gl_BaseInstance",
      "gl_Position",
      "gl_PointSize",
      "gl_ClipDistance",
      "gl_CullDistance",
      // perVertex
      // compatibility profile
      "gl_Color",
      "gl_SecondaryColor",
      "gl_Normal",
      "gl_Vertex",
      "gl_MultiTexCoord0",
      "gl_MultiTexCoord1",
      "gl_MultiTexCoord2",
      "gl_MultiTexCoord3",
      "gl_MultiTexCoord4",
      "gl_MultiTexCoord5",
      "gl_MultiTexCoord6",
      "gl_MultiTexCoord7",
      "gl_FogCoord"
    ],
    constants: [
      "gl_MaxVertexAttribs",
      "gl_MaxVertexUniformVectors",
      "gl_MaxVertexUniformComponents",
      "gl_MaxVertexOutputComponents"
      // TODO: add more constants from the 7.3 section of GLSLangSpec.4.60.pdf
    ],
    intsuffix: "[uU]?",
    floatsuffix: "([fF]|(fl|FL))?",
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment.line"],
        [/\/\*/, "comment.block", "@comment"],
        [/#[a-z]*/, {
          cases: {
            "@directives": "keyword.control.preprocessor",
            "@default": "invalid"
          }
        }],
        ["GL_ES", "meta.preprocessor"],
        [/__[A-Z_]+__/, {
          cases: {
            "@macros": "meta.preprocessor",
            "@default": "invalid"
          }
        }],
        [/[{}()\[\]]/, "@brackets"],
        [/(true|false)/, "constant"],
        [/[\=\+\-\*\/\>\<\&\|\%\!\^]+/, {
          cases: {
            "@operators": "operator",
            "@default": "invalid"
          }
        }],
        [/[a-zA-Z][a-zA-Z0-9_]*(?=\()/, "entity.name.function"],
        [/[a-zA-Z][a-zA-Z0-9_]*/, {
          cases: {
            "@storage": "storage.type",
            "@types": "entity.name.type",
            "@builtin_vars": "keyword",
            "@default": "variable.name"
          }
        }],
        [/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, "number.float"],
        [/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, "number.float"],
        [/0[xX][0-9a-fA-F](@intsuffix)/, "number.hex"],
        [/0[0-7](@intsuffix)/, "number.octal"],
        [/\d+(@intsuffix)/, "number"],
        [/[;,.]/, "delimiter"]
      ],
      comment: [
        ["\\*/", "comment.block", "@pop"],
        [".*", "comment.block"]
      ]
    }
  });
})();
return moduleExports;
})
