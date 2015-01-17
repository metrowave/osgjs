#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float exponent;
uniform float exponent1;
uniform vec4 Shadow_DepthRange;

varying vec4 FragEyePos;

#pragma include "colorEncode.glsl"

// see shadowSettings.js header for shadow algo param explanations

#ifdef _EVSM
// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 warpDepth(float depth, vec2 exponents)
{
    // Rescale depth into [-1, 1]
    depth = 2.0  * depth - 1.0;
    float pos =  exp( exponents.x * depth);
    float neg = -exp(-exponents.y * depth);
    return vec2(pos, neg);
}

// Convert depth value to EVSM representation
vec4 shadowDepthToEVSM(float depth)
{
    vec2 exponents = vec2(exponent, exponent1);
    vec2 warpedDepth = WarpDepth(depth, exponents);
    return  vec4(warpedDepth.xy, warpedDepth.xy * warpedDepth.xy);
}
#endif // _EVSM

void main(void) {
    float depth;
    // distance to camera
    depth =  -FragEyePos.z;
    // linearize (aka map z to near..far to 0..1)
    depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;

#if defined (_FLOATTEX) && defined(_PCF)
    gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
#elif defined (_FLOATTEX)  && defined(_ESM)
    float depthScale = exponent1;
    depth = depth*depthScale;
    gl_FragColor = shadowDepthToEVSM(depth);
#elif defined (_FLOATTEX)  && defined(_VSM)
    gl_FragColor = vec4(depth, depth*depth, 0.0, 1.0);
#elif defined (_FLOATTEX)  && defined(_EVSM)
    gl_FragColor = shadowDepthToEVSM(depth);
#elif defined (_FLOATTEX) // && defined(_NONE)
    gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
#elif defined(_PCF)
    gl_FragColor = encodeFloatRGBA(depth);
#elif defined(_ESM)
    float depthScale = exponent1;
    depth = depth*depthScale;
    gl_FragColor = encodeFloatRGBA(depth);
#elif defined(_VSM)
    gl_FragColor = encodeHalfFloatRGBA(vec2(depth, depth*depth));
#else // NONE
    gl_FragColor = encodeFloatRGBA(depth);
#endif



}
