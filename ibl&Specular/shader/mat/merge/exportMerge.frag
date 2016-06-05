#include "data/shader/mat/state.frag"

#ifndef	USE_OUTPUT1
	#define	USE_OUTPUT1
#endif

#ifndef	USE_OUTPUT2
	#define	USE_OUTPUT2
#endif

void	ExportMerge( inout FragmentState s )
{
	//albedo & alpha
	s.output0.xyz = sqrt( s.albedo.xyz );
	s.output0.w = s.albedo.w;

	//reflectivity & gloss
	s.output1.xyz = sqrt( s.reflectivity );
	s.output1.w = s.gloss;

	//normal
	s.output2.xyz = 0.5*s.normal + vec3(0.5,0.5,0.5);
	s.output2.w = 1.0;
}

#define Merge	ExportMerge