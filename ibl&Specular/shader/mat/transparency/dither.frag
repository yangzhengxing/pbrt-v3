#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tDitherPattern);

uniform float	uAlphaScale;
uniform vec4	uAlphaDitherScaleBias;
uniform vec2	uLayerFloorScale;

void	TransparencyDither( inout FragmentState s )
{
	vec2 tc = s.screenTexCoord * uAlphaDitherScaleBias.xy + uAlphaDitherScaleBias.zw;
	tc += floor( s.vertexTexCoord * uLayerFloorScale.x ) * uLayerFloorScale.y;
	float noise = texture2D( tDitherPattern, tc ).x;

	s.albedo.a = saturate( s.albedo.a * uAlphaScale );
	HINT_FLATTEN
	if( s.albedo.a < noise )
	{
		discard;
	}
}

#define	Transparency	TransparencyDither
