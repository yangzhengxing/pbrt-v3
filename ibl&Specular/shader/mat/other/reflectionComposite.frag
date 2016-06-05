#define DepthBlur_Type		vec3
#define	DepthBlur_Swizzle	xyz
#define DepthBlur_ToneMap	1
#include "depthBlur.sh"

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0.xyz = DepthBlur( fCoord, vec3(0.0, 0.0, 0.0) );
	OUT_COLOR0.w = 0.0;
}