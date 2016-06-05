#include "data/shader/mat/state.frag"

#ifndef USE_OUTPUT1
	#define	USE_OUTPUT1
#endif

void	ReflectionMerge( inout FragmentState s )
{
	//does nothing, reflection functions write directly to s.output0 and s.output1
}

#define	Merge	ReflectionMerge