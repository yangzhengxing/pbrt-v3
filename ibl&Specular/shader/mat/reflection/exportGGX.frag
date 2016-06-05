#include "data/shader/mat/state.frag"

void	ReflectionGGX( inout FragmentState s )
{
	s.gloss = s.gloss * s.gloss; //convert gloss value for export (approximate)
}

#define	Reflection	ReflectionGGX