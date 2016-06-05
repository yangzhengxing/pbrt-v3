#define DepthBlur_Type		float
#define	DepthBlur_Swizzle	w
#include "depthBlur.sh"

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(float)
END_PARAMS
{
	OUT_COLOR0 = DepthBlur( fCoord, 1.0 );
}