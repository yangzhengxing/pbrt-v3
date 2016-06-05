#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tGlossMap);

uniform vec4	uGlossSwizzle;
uniform vec2	uGlossScaleBias;
uniform float	uGlossHorizonSmooth;

void	MicrosurfaceGlossMap( inout FragmentState s )
{
	float g = dot( texture2D( tGlossMap, s.vertexTexCoord ), uGlossSwizzle );
	s.gloss = uGlossScaleBias.x * g + uGlossScaleBias.y;

	float h = saturate( dot( s.normal, s.vertexEye ) );
	h = uGlossHorizonSmooth - h * uGlossHorizonSmooth;
	s.gloss = mix( s.gloss, 1.0, h*h );
}

#define	Microsurface	MicrosurfaceGlossMap
