#include "data/shader/mat/state.frag"

uniform vec2	uBlendAlpha;

void	TransparencyBlend( inout FragmentState s )
{
	s.diffuseLight *= uBlendAlpha.x;
	s.albedo.xyz *= uBlendAlpha.x;

	s.specularLight *= uBlendAlpha.y;
	s.reflectivity.xyz *= uBlendAlpha.y;

	s.emissiveLight *= uBlendAlpha.y;
}

#define	Transparency	TransparencyBlend
