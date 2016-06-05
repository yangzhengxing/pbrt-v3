#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/shadowParams.sh"

void	DirectLightPremerge( inout FragmentState s )
{
	s.shadow = sampleShadowMask( s.screenTexCoord );
}

#define Premerge	DirectLightPremerge

void	DirectLightMerge( inout FragmentState s )
{
	s.output0.xyz =	s.diffuseLight + s.specularLight;
	s.output0.w =	s.albedo.a;
}

#define Merge	DirectLightMerge