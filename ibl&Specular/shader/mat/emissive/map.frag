#include "data/shader/mat/state.frag"

uniform vec3	uEmissiveColor;
uniform vec3	uEmission;
USE_TEXTURE2D(tEmissiveMap);

void	EmssiveMap( inout FragmentState s )
{
	vec3 emissiveMap = texture2D( tEmissiveMap, s.vertexTexCoord ).xyz;
	s.emissiveLight += uEmission + emissiveMap * uEmissiveColor;
}

#define	Emissive	EmssiveMap