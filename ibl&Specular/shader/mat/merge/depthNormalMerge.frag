#include "data/shader/mat/state.frag"

#ifndef USE_OUTPUT1
	#define	USE_OUTPUT1
#endif

void	DepthNormalMerge( inout FragmentState s )
{
	//face normal
	//s.output0.xyz = normalize( cross( ddy(s.vertexPosition), ddx(s.vertexPosition) ) );

	//render normal
	s.output0.xyz = s.normal;
	s.output0.w = s.albedo.a;

	//view space depth
	s.output1 = s.vertexPosition.zzzz;
}

#define	Merge	DepthNormalMerge