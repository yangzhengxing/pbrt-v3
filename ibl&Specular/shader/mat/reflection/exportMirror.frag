#include "data/shader/mat/state.frag"

void	ReflectionMirror( inout FragmentState s )
{
	s.gloss = 1.0; //convert gloss value for export
}

#define	Reflection	ReflectionMirror