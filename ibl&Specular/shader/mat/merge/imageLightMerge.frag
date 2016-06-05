#include "data/shader/mat/state.frag"

void	ImageLightMerge( inout FragmentState s )
{
	s.output0.xyz =	s.diffuseLight + s.specularLight + s.emissiveLight;
	s.output0.w =	s.albedo.a;
}

#define	Merge	ImageLightMerge