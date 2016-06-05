#include "data/shader/mat/state.frag"

uniform float	uShadowMergeScale;

void	ShadowMapMerge( inout FragmentState s )
{
	s.output0.x = uShadowMergeScale * length( s.vertexPosition );
	s.output0.w = s.albedo.a;
}

#define	Merge	ShadowMapMerge